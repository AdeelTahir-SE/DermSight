/**
 * Drizzle ORM schema for SQLite local database.
 * Local SQLite is the single source of truth — UI never waits on network.
 */

import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ── Users (Health Workers) ──────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  region: text("region").notNull(),
  pinHash: text("pin_hash").notNull(),
  supabaseUserId: text("supabase_user_id").notNull(),
  createdAt: text("created_at").notNull(),
});

// ── Patients ────────────────────────────────────────────────────────────
export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  sex: text("sex", { enum: ["male", "female", "other"] }).notNull(),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  capturedAt: text("captured_at").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  syncStatus: text("sync_status", { enum: ["pending", "synced", "failed"] })
    .notNull()
    .default("pending"),
  remoteId: text("remote_id"),
});

// ── Assessments ─────────────────────────────────────────────────────────
export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id),
  imageLocalUri: text("image_local_uri").notNull(),
  imageRemoteUrl: text("image_remote_url"),
  predictedClass: text("predicted_class", {
    enum: ["mel", "bcc", "akiec", "bkl", "df", "vasc", "nv"],
  }).notNull(),
  classProbabilities: text("class_probabilities").notNull(), // JSON string
  abcdAsymmetry: real("abcd_asymmetry").notNull(),
  abcdBorder: real("abcd_border").notNull(),
  abcdColor: real("abcd_color").notNull(),
  abcdDiameter: real("abcd_diameter").notNull(),
  riskTier: text("risk_tier", {
    enum: ["low", "medium", "high", "urgent_referral"],
  }).notNull(),
  confidenceScore: real("confidence_score").notNull(),
  modelVersion: text("model_version").notNull(),
  bodyLocation: text("body_location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  capturedAt: text("captured_at").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  syncStatus: text("sync_status", { enum: ["pending", "synced", "failed"] })
    .notNull()
    .default("pending"),
  remoteId: text("remote_id"),
  createdAt: text("created_at").notNull(),
});

// ── Sync Queue (Outbox Pattern) ─────────────────────────────────────────
export const syncQueue = sqliteTable("sync_queue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityType: text("entity_type", {
    enum: ["patient", "assessment"],
  }).notNull(),
  entityId: text("entity_id").notNull(),
  operation: text("operation", { enum: ["create", "update"] }).notNull(),
  payload: text("payload").notNull(), // JSON
  attemptCount: integer("attempt_count").notNull().default(0),
  lastAttemptedAt: text("last_attempted_at"),
  status: text("status", { enum: ["pending", "in_progress", "failed", "done"] })
    .notNull()
    .default("pending"),
  createdAt: text("created_at").notNull(),
});

// ── Model Versions ──────────────────────────────────────────────────────
export const modelVersions = sqliteTable("model_versions", {
  id: text("id").primaryKey(),
  versionTag: text("version_tag").notNull(),
  fileUri: text("file_uri").notNull(),
  downloadedAt: text("downloaded_at").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
});
