import * as FileSystem from "expo-file-system";
import { Paths } from "expo-file-system";
import { Platform } from "react-native";

const IMAGE_DIR_NAME = "dermsight_images";

/**
 * Ensure a directory exists for storing assessment images.
 */
export async function ensureImageDirectory(): Promise<string> {
  if (Platform.OS === "web") {
    return "";
  }
  const dirUri = `${Paths.document}/${IMAGE_DIR_NAME}`;
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
  const dirUri = `${Paths.document}/${IMAGE_DIR_NAME}`;
  const dirInfo = await FileSystem.getInfoAsync(dirUri);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  }
  const destUri = `${dirUri}/${assessmentId}.jpg`;
  await FileSystem.copyAsync({
    from: sourceUri,
    to: destUri,
  });
  return destUri;
}

/**
 * Delete a locally stored image.
 */
export async function deleteLocalImage(imageUri: string): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(imageUri);
    }
  } catch (e) {
    console.warn("Failed to delete local image:", e);
  }
}

/**
 * Get file size in KB for display.
 */
export async function getFileSizeKB(uri: string): Promise<number> {
  if (Platform.OS === "web") {
    return 0;
  }
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      return Math.round((fileInfo.size ?? 0) / 1024);
    }
  } catch {
    // Ignore
  }
  return 0;
}
