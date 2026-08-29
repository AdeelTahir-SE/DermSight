/**
 * Assessment repository — SQLite CRUD for assessments.
 */

import { db } from "@/db/client";
import { assessments, syncQueue } from "@/db/schema";
import type { Assessment, DiagnosisClass, InferenceResult } from "@/types";
import { saveImageLocally } from "@/utils/image";
import { generateUUID } from "@/utils/uuid";
import { desc, eq } from "drizzle-orm";

export async function getAssessmentsByPatient(
  patientId: string,
): Promise<Assessment[]> {
  const rows = db
    .select()
    .from(assessments)
    .where(eq(assessments.patientId, patientId))
    .orderBy(desc(assessments.createdAt))
    .all();
  return rows.map(mapRowToAssessment);
}

export async function getAssessmentById(
  id: string,
): Promise<Assessment | null> {
  const row = db.select().from(assessments).where(eq(assessments.id, id)).get();
  return row ? mapRowToAssessment(row) : null;
}

export async function getAllAssessments(): Promise<Assessment[]> {
  const rows = db
    .select()
    .from(assessments)
    .orderBy(desc(assessments.createdAt))
    .all();
  return rows.map(mapRowToAssessment);
}

export async function getAssessmentCount(): Promise<number> {
  const rows = db.select().from(assessments).all();
  return rows.length;
}

export async function getPendingSyncCount(): Promise<number> {
  const rows = db
    .select()
    .from(assessments)
    .where(eq(assessments.syncStatus, "pending"))
    .all();
  return rows.length;
}

export async function createAssessment(
  patientId: string,
  imageUri: string,
  result: InferenceResult,
  userId: string,
  bodyLocation?: string,
): Promise<Assessment> {
  const now = new Date().toISOString();
  const id = generateUUID();

  // Save image locally to persistent storage
  let finalImageUri = imageUri;
  try {
    if (imageUri) {
      finalImageUri = await saveImageLocally(imageUri, id);
    }
  } catch (e) {
    console.error("Failed to copy image to persistent storage, using original:", e);
  }

  const assessment: Assessment = {
    id,
    patientId,
    imageLocalUri: finalImageUri,
    imageRemoteUrl: null,
    predictedClass: result.predictedClass,
    classProbabilities: result.classProbabilities,
    abcdAsymmetry: result.abcdScores.asymmetry,
    abcdBorder: result.abcdScores.border,
    abcdColor: result.abcdScores.color,
    abcdDiameter: result.abcdScores.diameter,
    riskTier: result.riskTier,
    confidenceScore: result.confidenceScore,
    modelVersion: "1.0.0",
    bodyLocation: bodyLocation || null,
    latitude: null,
    longitude: null,
    capturedAt: now,
    createdBy: userId,
    syncStatus: "pending",
    remoteId: null,
    createdAt: now,
  };

  db.insert(assessments)
    .values({
      id: assessment.id,
      patientId: assessment.patientId,
      imageLocalUri: assessment.imageLocalUri,
      predictedClass: assessment.predictedClass,
      classProbabilities: JSON.stringify(assessment.classProbabilities),
      abcdAsymmetry: assessment.abcdAsymmetry,
      abcdBorder: assessment.abcdBorder,
      abcdColor: assessment.abcdColor,
      abcdDiameter: assessment.abcdDiameter,
      riskTier: assessment.riskTier,
      confidenceScore: assessment.confidenceScore,
      modelVersion: assessment.modelVersion,
      bodyLocation: assessment.bodyLocation,
      capturedAt: now,
      createdBy: userId,
      createdAt: now,
      syncStatus: "pending",
    })
    .run();

  // Enqueue sync
  db.insert(syncQueue)
    .values({
      entityType: "assessment",
      entityId: id,
      operation: "create",
      payload: JSON.stringify(assessment),
      attemptCount: 0,
      status: "pending",
      createdAt: now,
    })
    .run();

  return assessment;
}

function mapRowToAssessment(row: any): Assessment {
  return {
    id: row.id,
    patientId: row.patientId,
    imageLocalUri: row.imageLocalUri,
    imageRemoteUrl: row.imageRemoteUrl,
    predictedClass: row.predictedClass as DiagnosisClass,
    classProbabilities: JSON.parse(row.classProbabilities || "{}"),
    abcdAsymmetry: row.abcdAsymmetry,
    abcdBorder: row.abcdBorder,
    abcdColor: row.abcdColor,
    abcdDiameter: row.abcdDiameter,
    riskTier: row.riskTier,
    confidenceScore: row.confidenceScore,
    modelVersion: row.modelVersion,
    bodyLocation: row.bodyLocation,
    latitude: row.latitude,
    longitude: row.longitude,
    capturedAt: row.capturedAt,
    createdBy: row.createdBy,
    syncStatus: row.syncStatus,
    remoteId: row.remoteId,
    createdAt: row.createdAt,
  };
}
