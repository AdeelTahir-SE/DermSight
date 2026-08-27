/**
 * Image utilities — compression and path helpers for local storage.
 * Uses the new expo-file-system v57 API (Paths, File, Directory).
 */

import { Directory, File, Paths } from "expo-file-system";

const IMAGE_DIR_NAME = "dermsight_images";

/**
 * Ensure a directory exists for storing assessment images.
 */
export async function ensureImageDirectory(): Promise<string> {
  const dir = new Directory(Paths.document, IMAGE_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir.uri;
}

/**
 * Copy a captured image to our app's private storage directory.
 */
export async function saveImageLocally(
  sourceUri: string,
  assessmentId: string,
): Promise<string> {
  const dir = new Directory(Paths.document, IMAGE_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  const source = new File(sourceUri);
  const dest = new File(dir, `${assessmentId}.jpg`);
  await source.copy(dest);
  return dest.uri;
}

/**
 * Delete a locally stored image.
 */
export async function deleteLocalImage(imageUri: string): Promise<void> {
  const file = new File(imageUri);
  if (file.exists) {
    file.delete();
  }
}

/**
 * Get file size in KB for display.
 */
export async function getFileSizeKB(uri: string): Promise<number> {
  const file = new File(uri);
  if (file.exists) {
    const info = file.info();
    return Math.round((info.size ?? 0) / 1024);
  }
  return 0;
}
