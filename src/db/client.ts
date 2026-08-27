/**
 * SQLite database client using expo-sqlite + Drizzle ORM.
 * Local DB is the single source of truth for the offline-first architecture.
 */

import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const DB_NAME = "dermsight.db";

const expo = openDatabaseSync(DB_NAME);

export const db = drizzle(expo, { schema });

/**
 * Initialize database tables. Called once on app startup.
 */
export function initializeDatabase(): void {
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      full_name TEXT NOT NULL,
      region TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      supabase_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      sex TEXT NOT NULL CHECK(sex IN ('male', 'female', 'other')),
      phone TEXT,
      address TEXT,
      notes TEXT,
      latitude REAL,
      longitude REAL,
      captured_at TEXT NOT NULL,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      remote_id TEXT
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY NOT NULL,
      patient_id TEXT NOT NULL REFERENCES patients(id),
      image_local_uri TEXT NOT NULL,
      image_remote_url TEXT,
      predicted_class TEXT NOT NULL,
      class_probabilities TEXT NOT NULL,
      abcd_asymmetry REAL NOT NULL,
      abcd_border REAL NOT NULL,
      abcd_color REAL NOT NULL,
      abcd_diameter REAL NOT NULL,
      risk_tier TEXT NOT NULL,
      confidence_score REAL NOT NULL,
      model_version TEXT NOT NULL,
      body_location TEXT,
      latitude REAL,
      longitude REAL,
      captured_at TEXT NOT NULL,
      created_by TEXT NOT NULL REFERENCES users(id),
      sync_status TEXT NOT NULL DEFAULT 'pending',
      remote_id TEXT,
      created_at TEXT NOT NULL
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      last_attempted_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS model_versions (
      id TEXT PRIMARY KEY NOT NULL,
      version_tag TEXT NOT NULL,
      file_uri TEXT NOT NULL,
      downloaded_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export { expo as rawDb };
