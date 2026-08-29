/**
 * Patient repository — SQLite CRUD operations.
 * Local DB is the single source of truth.
 */

import { db } from "@/db/client";
import { patients, syncQueue } from "@/db/schema";
import type { Patient } from "@/types";
import { generateUUID } from "@/utils/uuid";
import { desc, eq, like, or } from "drizzle-orm";
import type { PatientFormData } from "./types";

export async function getAllPatients(): Promise<Patient[]> {
  const rows = db
    .select()
    .from(patients)
    .orderBy(desc(patients.createdAt))
    .all();
  return rows.map(mapRowToPatient);
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const searchPattern = `%${query}%`;
  const rows = db
    .select()
    .from(patients)
    .where(
      or(
        like(patients.firstName, searchPattern),
        like(patients.lastName, searchPattern),
        like(patients.id, searchPattern),
      ),
    )
    .orderBy(desc(patients.createdAt))
    .all();
  return rows.map(mapRowToPatient);
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const row = db.select().from(patients).where(eq(patients.id, id)).get();
  return row ? mapRowToPatient(row) : null;
}

function normalizeDateOfBirth(dob: string): string {
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
}

export async function createPatient(
  data: PatientFormData,
  userId: string,
): Promise<Patient> {
  const now = new Date().toISOString();
  const id = generateUUID();
  const normalizedDob = normalizeDateOfBirth(data.dateOfBirth);

  const patient: Patient = {
    id,
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: normalizedDob,
    sex: data.sex,
    phone: data.phone || null,
    address: data.address || null,
    notes: data.notes || null,
    latitude: null,
    longitude: null,
    capturedAt: now,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
    remoteId: null,
  };

  db.insert(patients)
    .values({
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      sex: patient.sex,
      phone: patient.phone,
      address: patient.address,
      notes: patient.notes,
      capturedAt: now,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      syncStatus: "pending",
    })
    .run();

  // Enqueue sync
  db.insert(syncQueue)
    .values({
      entityType: "patient",
      entityId: id,
      operation: "create",
      payload: JSON.stringify(patient),
      attemptCount: 0,
      status: "pending",
      createdAt: now,
    })
    .run();

  return patient;
}

export async function deletePatient(id: string): Promise<void> {
  db.delete(patients).where(eq(patients.id, id)).run();
}

function mapRowToPatient(row: any): Patient {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    sex: row.sex,
    phone: row.phone,
    address: row.address,
    notes: row.notes,
    latitude: row.latitude,
    longitude: row.longitude,
    capturedAt: row.capturedAt,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    syncStatus: row.syncStatus,
    remoteId: row.remoteId,
  };
}
