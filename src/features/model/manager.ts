/**
 * Model manager — reports real on-device model info and handles
 * over-the-air model updates versioned via the local model_versions table.
 * Remote updates are published as `model-v<semver>.tflite` files in the
 * Supabase "models" storage bucket.
 */

import { db } from "@/db/client";
import { modelVersions } from "@/db/schema";
import { supabase } from "@/lib/supabase";
import { eq } from "drizzle-orm";
import { Asset } from "expo-asset";
import { Directory, File, Paths } from "expo-file-system";

// Same bundled asset used by the inference engine.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BUNDLED_MODEL = require("../../../assets/models/model.tflite");

export const BUNDLED_MODEL_VERSION = "1.0.0";
const MODELS_BUCKET = "models";
const REMOTE_FILE_PATTERN = /^model-v(\d+\.\d+\.\d+)\.tflite$/;

export interface ActiveModelInfo {
  versionTag: string;
  source: "bundled" | "downloaded";
  fileUri: string | null;
  sizeBytes: number | null;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  latestVersion: string | null;
  fileName: string | null;
}

/**
 * Return the active downloaded model row, if any.
 */
export function getActiveDownloadedModel() {
  try {
    return (
      db
        .select()
        .from(modelVersions)
        .where(eq(modelVersions.isActive, true))
        .get() ?? null
    );
  } catch {
    return null;
  }
}

/**
 * Resolve real info about the model the app is currently using.
 */
export async function getActiveModelInfo(): Promise<ActiveModelInfo> {
  const active = getActiveDownloadedModel();
  if (active) {
    let sizeBytes: number | null = null;
    try {
      const file = new File(active.fileUri);
      sizeBytes = file.exists ? (file.size ?? null) : null;
    } catch {
      sizeBytes = null;
    }
    return {
      versionTag: active.versionTag,
      source: "downloaded",
      fileUri: active.fileUri,
      sizeBytes,
    };
  }

  // Bundled model — resolve the packaged asset to measure its real size.
  let sizeBytes: number | null = null;
  let fileUri: string | null = null;
  try {
    const asset = Asset.fromModule(BUNDLED_MODEL);
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    if (asset.localUri) {
      fileUri = asset.localUri;
      const file = new File(asset.localUri);
      sizeBytes = file.exists ? (file.size ?? null) : null;
    }
  } catch {
    sizeBytes = null;
  }
  return {
    versionTag: BUNDLED_MODEL_VERSION,
    source: "bundled",
    fileUri,
    sizeBytes,
  };
}

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Check the remote models bucket for a newer model version.
 */
export async function checkForModelUpdate(): Promise<UpdateCheckResult> {
  const currentVersion =
    getActiveDownloadedModel()?.versionTag ?? BUNDLED_MODEL_VERSION;

  const { data, error } = await supabase.storage.from(MODELS_BUCKET).list();
  if (error) {
    // Bucket not provisioned yet — no updates published.
    return { updateAvailable: false, latestVersion: null, fileName: null };
  }

  let latestVersion = currentVersion;
  let fileName: string | null = null;
  for (const item of data ?? []) {
    const match = REMOTE_FILE_PATTERN.exec(item.name);
    if (match && compareSemver(match[1], latestVersion) > 0) {
      latestVersion = match[1];
      fileName = item.name;
    }
  }

  return {
    updateAvailable: fileName !== null,
    latestVersion: fileName ? latestVersion : null,
    fileName,
  };
}

/**
 * Download a model update, store it locally and mark it as the active model.
 * Returns the new active model row values.
 */
export async function downloadModelUpdate(
  fileName: string,
  versionTag: string,
): Promise<{ versionTag: string; fileUri: string }> {
  // Resolve a URL for the remote model file (signed first, public fallback).
  let url: string | null = null;
  const { data: signed } = await supabase.storage
    .from(MODELS_BUCKET)
    .createSignedUrl(fileName, 3600);
  if (signed?.signedUrl) {
    url = signed.signedUrl;
  } else {
    const { data: pub } = supabase.storage
      .from(MODELS_BUCKET)
      .getPublicUrl(fileName);
    url = pub?.publicUrl ?? null;
  }
  if (!url) {
    throw new Error("Could not resolve model download URL");
  }

  const modelsDir = new Directory(Paths.document, "models");
  try {
    modelsDir.create({ intermediates: true, idempotent: true });
  } catch {
    // Directory already exists.
  }

  const destination = new File(modelsDir, fileName);
  try {
    if (destination.exists) destination.delete();
  } catch {
    // Overwrite below.
  }
  const downloaded = await File.downloadFileAsync(url, destination);

  // Deactivate previous versions and activate the new one.
  db.update(modelVersions).set({ isActive: false }).run();
  db.insert(modelVersions)
    .values({
      id: `${versionTag}-${Date.now()}`,
      versionTag,
      fileUri: downloaded.uri,
      downloadedAt: new Date().toISOString(),
      isActive: true,
    })
    .run();

  return { versionTag, fileUri: downloaded.uri };
}
