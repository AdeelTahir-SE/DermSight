import { Directory, File, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const IMAGE_DIR_NAME = "dermsight_images";

/**
 * Normalize image URI to ensure double URL encoding for Expo Go cache paths on Android.
 * Bypasses Glide/native file system decoding issues.
 */
export function normalizeImageUri(uri: string): string {
  if (!uri || Platform.OS === "web") return uri;
  
  if (uri.includes("ExperienceData")) {
    let normalized = uri;
    // 1. If it contains "%40anonymous/Dermsight" (single-decoded)
    if (normalized.includes("%40anonymous/Dermsight")) {
      normalized = normalized.replace(/%40anonymous\/Dermsight/g, "%2540anonymous%252FDermsight");
    }
    // 2. If it contains "%40" but not "%2540"
    if (normalized.includes("%40") && !normalized.includes("%2540")) {
      normalized = normalized.replace(/%40/g, "%2540");
    }
    // 3. If it contains "%2F" but not "%252F"
    if (normalized.includes("%2F") && !normalized.includes("%252F")) {
      normalized = normalized.replace(/%2F/g, "%252F");
    }
    return normalized;
  }
  return uri;
}

/**
 * Ensure a directory exists for storing assessment images.
 */
export async function ensureImageDirectory(): Promise<string> {
  if (Platform.OS === "web") {
    return "";
  }
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || "";
  const dirUri = `${baseDir}${IMAGE_DIR_NAME}`;
  try {
    const dirInfo = await FileSystem.getInfoAsync(dirUri);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    }
  } catch (e) {
    console.error("Failed to ensure image directory:", e);
  }
  return dirUri;
}

/**
 * Copy a captured image to our app's private storage directory.
 */
export async function saveImageLocally(
  sourceUri: string,
  assessmentId: string,
): Promise<string> {
  if (Platform.OS === "web") {
    return sourceUri;
  }
  const dir = new Directory(Paths.document, IMAGE_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  const normalizedSource = normalizeImageUri(sourceUri);
  const source = new File(normalizedSource);
  const dest = new File(dir, `${assessmentId}.jpg`);
  await source.copy(dest);
  return dest.uri;
}

/**
 * Delete a locally stored image.
 */
export async function deleteLocalImage(imageUri: string): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }
  const normalizedUri = normalizeImageUri(imageUri);
  const file = new File(normalizedUri);
  if (file.exists) {
    file.delete();
  }
}

/**
 * Get file size in KB for display.
 */
export async function getFileSizeKB(uri: string): Promise<number> {
  if (Platform.OS === "web") {
    return 0;
  }
  const normalizedUri = normalizeImageUri(uri);
  const file = new File(normalizedUri);
  if (file.exists) {
    const info = file.info();
    return Math.round((info.size ?? 0) / 1024);
  }
  return 0;
}
