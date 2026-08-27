/**
 * Image utilities — compression and path helpers for local storage.
 */

import * as FileSystem from "expo-file-system";

/**
 * Ensure a directory exists for storing assessment images.
 */
export async function ensureImageDirectory(): Promise<string> {
  const dir = `${FileSystem.documentDirectory}dermsight_images/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Copy a captured image to our app's private storage directory.
 */
export async function saveImageLocally(
  sourceUri: string,
  assessmentId: string,
): Promise<string> {
  const dir = await ensureImageDirectory();
  const destUri = `${dir}${assessmentId}.jpg`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

/**
 * Delete a locally stored image.
 */
export async function deleteLocalImage(imageUri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(imageUri);
  if (info.exists) {
    await FileSystem.deleteAsync(imageUri);
  }
}

/**
 * Get file size in KB for display.
 */
export async function getFileSizeKB(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri, { size: true });
  if (info.exists && info.size !== undefined) {
    return Math.round(info.size / 1024);
  }
  return 0;
}
