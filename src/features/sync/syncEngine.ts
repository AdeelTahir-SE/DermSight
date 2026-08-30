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
import { base64ToUint8Array } from "@/utils/base64";
import { normalizeImageUri } from "@/utils/image";
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
  } catch {
    // Non-fatal — failed items simply stay failed until the next run.
  }

  const pendingItems = getPendingSyncItems();
  let success = 0;
  let failed = 0;

  for (const item of pendingItems) {
    try {
      // Optimization: Skip assessments whose patient has not synced yet
      if (item.entityType === "assessment") {
        const payload = JSON.parse(item.payload);
        let patientId =
          payload.patientId ||
          payload.patient_id ||
          payload.patientLocalId ||
          payload.patient_local_id;

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
  } catch {
    // UI refresh failure does not affect sync outcome.
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
      throw new Error(
        `Local patient with ID ${item.entityId} not found in SQLite. Cannot sync.`,
      );
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
      throw new Error(
        `Local assessment with ID ${item.entityId} not found in SQLite. Cannot sync.`,
      );
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
      } catch {
        // Leave as string — server accepts serialized JSON.
      }
    }

    const { data, error } = await supabase.rpc("upsert_assessment", {
      p_local_id: localAssessment.id,
      p_patient_local_id: localAssessment.patientId,
      p_image_local_uri: localUri,
      p_image_remote_url:
        imageRemoteUrl || localAssessment.imageRemoteUrl || null,
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
    const localUri =
      assessmentPayload.imageLocalUri || assessmentPayload.image_local_uri;
    if (!localUri) return null;

    // Read the file as base64 using the new expo-file-system API, then decode to bytes
    const normalizedUri = normalizeImageUri(localUri);
    const file = new File(normalizedUri);
    if (!file.exists) {
      throw new Error(`Image file does not exist: ${normalizedUri}`);
    }
    const base64 = await file.base64();
    const bytes = base64ToUint8Array(base64);

    const workerId =
      assessmentPayload.createdBy || assessmentPayload.created_by;
    const assessmentId = assessmentPayload.id;
    const filePath = `${workerId}/${assessmentId}.jpg`;

    const { data, error } = await supabase.storage
      .from("lesion-images")
      .upload(filePath, bytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      return null;
    }

    // Get the public or signed URL
    const { data: urlData } = supabase.storage
      .from("lesion-images")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch {
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

/**
 * Pull all data from Supabase remote database for the current health worker.
 * Saves/updates all patients and assessments in the local SQLite database.
 */
export async function pullRemoteData(
  workerId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!workerId) {
      return {
        success: false,
        error: "No authenticated health worker ID provided.",
      };
    }

    console.log("Starting remote data pull for health worker:", workerId);

    // 2. Fetch remote patients created by this health worker
    const { data: remotePatients, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("created_by", workerId);

    if (patientError) {
      console.error("Failed to pull remote patients:", patientError.message);
      return {
        success: false,
        error: `Pull patients failed: ${patientError.message}`,
      };
    }

    // 3. Upsert remote patients into local SQLite database
    if (remotePatients && remotePatients.length > 0) {
      for (const p of remotePatients) {
        db.insert(patients)
          .values({
            id: p.local_id, // Match local ID
            firstName: p.first_name,
            lastName: p.last_name,
            dateOfBirth: p.date_of_birth,
            sex: p.sex,
            phone: p.phone || null,
            address: p.address || null,
            notes: p.notes || null,
            latitude: p.latitude || null,
            longitude: p.longitude || null,
            capturedAt: p.captured_at,
            createdBy: p.created_by,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            syncStatus: "synced", // Since it came from remote, it is already synced!
            remoteId: p.id, // Set the remote UUID
          })
          .onConflictDoUpdate({
            target: patients.id,
            set: {
              firstName: p.first_name,
              lastName: p.last_name,
              dateOfBirth: p.date_of_birth,
              sex: p.sex,
              phone: p.phone || null,
              address: p.address || null,
              notes: p.notes || null,
              latitude: p.latitude || null,
              longitude: p.longitude || null,
              updatedAt: p.updated_at,
              syncStatus: "synced",
              remoteId: p.id,
            },
          })
          .run();
      }
    }

    // 4. Fetch remote assessments created by this health worker
    const { data: remoteAssessments, error: assessmentError } = await supabase
      .from("assessments")
      .select(
        `
        *,
        patients!inner(local_id)
      `,
      )
      .eq("created_by", workerId);

    if (assessmentError) {
      console.error(
        "Failed to pull remote assessments:",
        assessmentError.message,
      );
      return {
        success: false,
        error: `Pull assessments failed: ${assessmentError.message}`,
      };
    }

    // 5. Upsert remote assessments into local SQLite database
    if (remoteAssessments && remoteAssessments.length > 0) {
      for (const a of remoteAssessments) {
        // Resolve patient's local ID
        const patientLocalId = (a as any).patients?.local_id || a.patient_id;

        db.insert(assessments)
          .values({
            id: a.local_id, // Match local ID
            patientId: patientLocalId,
            imageLocalUri: a.image_local_uri || "",
            imageRemoteUrl: a.image_remote_url || null,
            predictedClass: a.predicted_class,
            classProbabilities:
              typeof a.class_probabilities === "string"
                ? a.class_probabilities
                : JSON.stringify(a.class_probabilities),
            abcdAsymmetry: a.abcd_asymmetry,
            abcdBorder: a.abcd_border,
            abcdColor: a.abcd_color,
            abcdDiameter: a.abcd_diameter,
            riskTier: a.risk_tier,
            confidenceScore: a.confidence_score,
            modelVersion: a.model_version,
            bodyLocation: a.body_location || null,
            latitude: a.latitude || null,
            longitude: a.longitude || null,
            capturedAt: a.captured_at,
            createdBy: a.created_by,
            syncStatus: "synced", // Already synced!
            remoteId: a.id,
            createdAt: a.created_at,
          })
          .onConflictDoUpdate({
            target: assessments.id,
            set: {
              patientId: patientLocalId,
              imageLocalUri: a.image_local_uri || "",
              imageRemoteUrl: a.image_remote_url || null,
              predictedClass: a.predicted_class,
              classProbabilities:
                typeof a.class_probabilities === "string"
                  ? a.class_probabilities
                  : JSON.stringify(a.class_probabilities),
              abcdAsymmetry: a.abcd_asymmetry,
              abcdBorder: a.abcd_border,
              abcdColor: a.abcd_color,
              abcdDiameter: a.abcd_diameter,
              riskTier: a.risk_tier,
              confidenceScore: a.confidence_score,
              modelVersion: a.model_version,
              bodyLocation: a.body_location || null,
              latitude: a.latitude || null,
              longitude: a.longitude || null,
              syncStatus: "synced",
              remoteId: a.id,
            },
          })
          .run();
      }
    }

    // 6. Refresh Zustand stores from SQLite
    try {
      usePatientsStore.getState().loadPatients();
      useAssessmentsStore.getState().loadAll();
      useAssessmentsStore.getState().loadCounts();
    } catch (storeError) {
      console.warn(
        "Failed to refresh Zustand stores after remote pull:",
        storeError,
      );
    }

    console.log("Successfully pulled all remote records from Supabase!");
    return { success: true };
  } catch (e: any) {
    console.error("Failed to pull remote database data:", e);
    return { success: false, error: e?.message || "Data pull error" };
  }
}
