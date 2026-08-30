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

  // Clean up legacy placeholder names from SQLite users table
  try {
    expo.execSync(`
      UPDATE users 
      SET full_name = '' 
      WHERE full_name IN ('Health Worker', 'Community Health Worker', 'Aisha', 'HW', 'User');
    `);
  } catch (err) {
    console.error("Failed to clean legacy user names:", err);
  }

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

  // One-time data cleanup: repair any malformed date_of_birth records
  try {
    const normalizeDateOfBirth = (dob: string): string => {
      const parts = dob.replace(/\s+/g, "").split(/[-/]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (year > 1000 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const monthStr = month.toString().padStart(2, "0");
          const dayStr = day.toString().padStart(2, "0");
          return `${year}-${monthStr}-${dayStr}`;
        }
      }
      return dob;
    };

    // 1. Scan and update patients table
    const selectPatients = expo.prepareSync("SELECT id, date_of_birth FROM patients");
    const patientsRows = selectPatients.executeSync().getAllSync() as any[];
    selectPatients.finalizeSync();

    const updatePatientStmt = expo.prepareSync("UPDATE patients SET date_of_birth = ? WHERE id = ?");
    for (const row of patientsRows) {
      const normalized = normalizeDateOfBirth(row.date_of_birth);
      if (normalized !== row.date_of_birth) {
        updatePatientStmt.executeSync([normalized, row.id]);
      }
    }
    updatePatientStmt.finalizeSync();

    // 2. Scan and update sync_queue table payloads
    const selectQueue = expo.prepareSync("SELECT id, payload FROM sync_queue WHERE entity_type = 'patient'");
    const queueRows = selectQueue.executeSync().getAllSync() as any[];
    selectQueue.finalizeSync();

    const updateQueueStmt = expo.prepareSync("UPDATE sync_queue SET payload = ? WHERE id = ?");
    for (const row of queueRows) {
      try {
        const payload = JSON.parse(row.payload);
        if (payload && payload.dateOfBirth) {
          const normalized = normalizeDateOfBirth(payload.dateOfBirth);
          if (normalized !== payload.dateOfBirth) {
            payload.dateOfBirth = normalized;
            updateQueueStmt.executeSync([JSON.stringify(payload), row.id]);
          }
        }
      } catch (e) {
        console.error("Failed to parse/update sync_queue payload:", e);
      }
    }
    updateQueueStmt.finalizeSync();
  } catch (err) {
    console.error("One-time database cleanup failed:", err);
  }
}

export { expo as rawDb };
