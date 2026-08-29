/**
 * Sync engine — orchestrates outbox → Supabase push/pull.
 * UI never waits on network; all sync happens in background.
 * Calls server-side RPC functions defined in supabase/migrations/004.
 */

import { db } from "@/db/client";
import { assessments, patients, syncQueue } from "@/db/schema";
import { useAssessmentsStore } from "@/features/assessments/store";
import { usePatientsStore } from "@/features/patients/store";
import { isConnected } from "@/lib/netinfo";
import { supabase } from "@/lib/supabase";
import type { SyncQueueItem } from "@/types";
import { eq } from "drizzle-orm";
import { File } from "expo-file-system";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

export interface SyncResult {
  success: number;
  failed: number;
  skipped: number;
}

/**
 * Get all pending sync queue items.
 */
export function getPendingSyncItems(): SyncQueueItem[] {
  const rows = db
    .select()
    .from(syncQueue)
    .where(eq(syncQueue.status, "pending"))
    .all();
  return rows.map(mapRow);
}

/**
 * Get all sync queue items (including failed).
 */
export function getAllSyncItems(): SyncQueueItem[] {
  const rows = db.select().from(syncQueue).all();
  return rows.map(mapRow);
}

/**
 * Get count of pending sync items.
 */
export function getPendingCount(): number {
  return db
    .select()
    .from(syncQueue)
    .where(eq(syncQueue.status, "pending"))
    .all().length;
}

/**
 * Run the sync engine — process pending queue items.
 */
export async function runSync(): Promise<SyncResult> {
  const online = await isConnected();
  if (!online) {
    return { success: 0, failed: 0, skipped: getPendingCount() };
  }

  // Reset failed queue items to pending so they are retried
  try {
    db.update(syncQueue)
      .set({ status: "pending", attemptCount: 0 })
      .where(eq(syncQueue.status, "failed"))
      .run();
  } catch (e) {
    console.warn("Failed to reset failed sync items:", e);
  }

  const pendingItems = getPendingSyncItems();
  let success = 0;
  let failed = 0;

  for (const item of pendingItems) {
    try {
      // Optimization: Skip assessments whose patient has not synced yet
      if (item.entityType === "assessment") {
        const payload = JSON.parse(item.payload);
        let patientId = payload.patientId || payload.patient_id || payload.patientLocalId || payload.patient_local_id;
        
        if (!patientId) {
          const localAssessment = db
            .select()
            .from(assessments)
            .where(eq(assessments.id, item.entityId))
            .get();
          if (localAssessment) {
            patientId = localAssessment.patientId;
          }
        }

        const patientRow = db
          .select()
          .from(patients)
          .where(eq(patients.id, patientId ?? ""))
          .get();

        if (!patientRow || !patientRow.remoteId) {
          // Keep it pending and check in the next cycle
          continue;
        }
      }

      // Mark as in_progress
      db.update(syncQueue)
        .set({
          status: "in_progress",
          lastAttemptedAt: new Date().toISOString(),
        })
        .where(eq(syncQueue.id, item.id))
        .run();

      // Push entity to Supabase via RPC
      const remoteId = await uploadToSupabase(item);

      // Store the remote ID back in the local table
      if (remoteId) {
        if (item.entityType === "patient") {
          db.update(patients)
            .set({ remoteId, syncStatus: "synced" })
            .where(eq(patients.id, item.entityId))
            .run();
        } else if (item.entityType === "assessment") {
          db.update(assessments)
            .set({ remoteId, syncStatus: "synced" })
            .where(eq(assessments.id, item.entityId))
            .run();
        }
      }

      db.update(syncQueue)
        .set({ status: "done" })
        .where(eq(syncQueue.id, item.id))
        .run();

      success++;
    } catch {
      const newAttempts = item.attemptCount + 1;
      const newStatus = newAttempts >= MAX_RETRIES ? "failed" : "pending";

      db.update(syncQueue)
        .set({
          attemptCount: newAttempts,
          status: newStatus,
          lastAttemptedAt: new Date().toISOString(),
        })
        .where(eq(syncQueue.id, item.id))
        .run();

      if (newStatus === "failed") failed++;

      // Exponential backoff
      const delay = BASE_DELAY_MS * Math.pow(2, newAttempts);
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(delay, 30000)),
      );
    }
  }

  // Refresh Zustand stores from SQLite database so UI reflects the synced state
  try {
    usePatientsStore.getState().loadPatients();
    useAssessmentsStore.getState().loadAll();
    useAssessmentsStore.getState().loadCounts();
  } catch (storeError) {
    console.warn("Failed to refresh Zustand stores after sync:", storeError);
  }

  return { success, failed, skipped: 0 };
}

/**
 * Retry a specific failed sync item.
 */
export async function retrySyncItem(itemId: number): Promise<boolean> {
  try {
    db.update(syncQueue)
      .set({ status: "pending", attemptCount: 0 })
      .where(eq(syncQueue.id, itemId))
      .run();
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload an entity to Supabase using RPC functions.
 * Returns the remote UUID assigned by the server.
 */
async function uploadToSupabase(item: SyncQueueItem): Promise<string | null> {
  if (item.entityType === "patient") {
    const localPatient = db
      .select()
      .from(patients)
      .where(eq(patients.id, item.entityId))
      .get();

    if (!localPatient) {
      throw new Error(`Local patient with ID ${item.entityId} not found in SQLite. Cannot sync.`);
    }

    const { data, error } = await supabase.rpc("upsert_patient", {
      p_local_id: localPatient.id,
      p_first_name: localPatient.firstName,
      p_last_name: localPatient.lastName,
      p_date_of_birth: localPatient.dateOfBirth,
      p_sex: localPatient.sex,
      p_phone: localPatient.phone ?? null,
      p_address: localPatient.address ?? null,
      p_notes: localPatient.notes ?? null,
      p_latitude: localPatient.latitude ?? null,
      p_longitude: localPatient.longitude ?? null,
      p_captured_at: localPatient.capturedAt,
    });
    if (error) throw new Error(`Patient sync failed: ${error.message}`);
    return data as string;
  }

  if (item.entityType === "assessment") {
    const localAssessment = db
      .select()
      .from(assessments)
      .where(eq(assessments.id, item.entityId))
      .get();

    if (!localAssessment) {
      throw new Error(`Local assessment with ID ${item.entityId} not found in SQLite. Cannot sync.`);
    }

    const localUri = localAssessment.imageLocalUri;
    // Upload image first if we have a local URI
    let imageRemoteUrl: string | null = localAssessment.imageRemoteUrl;
    if (localUri && !imageRemoteUrl) {
      // Create a temporary payload structure for uploadImage compatibility
      imageRemoteUrl = await uploadImage({
        imageLocalUri: localUri,
        createdBy: localAssessment.createdBy,
        id: localAssessment.id,
      });
    }

    let classProbs = localAssessment.classProbabilities;
    if (typeof classProbs === "string") {
      try {
        classProbs = JSON.parse(classProbs);
      } catch (e) {
        console.warn("Failed to parse class probabilities string:", e);
      }
    }

    const { data, error } = await supabase.rpc("upsert_assessment", {
      p_local_id: localAssessment.id,
      p_patient_local_id: localAssessment.patientId,
      p_image_local_uri: localUri,
      p_image_remote_url: imageRemoteUrl || localAssessment.imageRemoteUrl || null,
      p_predicted_class: localAssessment.predictedClass,
      p_class_probabilities: classProbs,
      p_abcd_asymmetry: localAssessment.abcdAsymmetry,
      p_abcd_border: localAssessment.abcdBorder,
      p_abcd_color: localAssessment.abcdColor,
      p_abcd_diameter: localAssessment.abcdDiameter,
      p_risk_tier: localAssessment.riskTier,
      p_confidence_score: localAssessment.confidenceScore,
      p_model_version: localAssessment.modelVersion,
      p_body_location: localAssessment.bodyLocation ?? null,
      p_latitude: localAssessment.latitude ?? null,
      p_longitude: localAssessment.longitude ?? null,
      p_captured_at: localAssessment.capturedAt,
    });
    if (error) throw new Error(`Assessment sync failed: ${error.message}`);
    return data as string;
  }

  return null;
}

/**
 * Upload a lesion image to Supabase Storage.
 * Path pattern: {worker_id}/{assessment_local_id}.jpg
 */
async function uploadImage(
  assessmentPayload: Record<string, any>,
): Promise<string | null> {
  try {
    const localUri = assessmentPayload.imageLocalUri || assessmentPayload.image_local_uri;
    if (!localUri) return null;
 
    // Read the file as Uint8Array using new expo-file-system v57 API
    const file = new File(localUri);
    const bytes = await file.bytes();
 
    const workerId = assessmentPayload.createdBy || assessmentPayload.created_by;
    const assessmentId = assessmentPayload.id;
    const filePath = `${workerId}/${assessmentId}.jpg`;

    const { data, error } = await supabase.storage
      .from("lesion-images")
      .upload(filePath, bytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.warn("Image upload failed:", error.message);
      return null;
    }

    // Get the public or signed URL
    const { data: urlData } = supabase.storage
      .from("lesion-images")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (e) {
    console.warn("Image upload error:", e);
    return null;
  }
}

function mapRow(row: any): SyncQueueItem {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    operation: row.operation,
    payload: row.payload,
    attemptCount: row.attemptCount,
    lastAttemptedAt: row.lastAttemptedAt,
    status: row.status,
    createdAt: row.createdAt,
  };
}
