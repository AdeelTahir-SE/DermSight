import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

const IMAGE_DIR_NAME = "dermsight_images";

/**
 * Ensure a directory exists for storing assessment images.
 */
export async function ensureImageDirectory(): Promise<string> {
  if (Platform.OS === "web") {
    return "";
  }
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
  if (Platform.OS === "web") {
    return sourceUri;
  }
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
  if (Platform.OS === "web") {
    return;
  }
  const file = new File(imageUri);
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
  const file = new File(uri);
  if (file.exists) {
    const info = file.info();
    return Math.round((info.size ?? 0) / 1024);
  }
  return 0;
}
