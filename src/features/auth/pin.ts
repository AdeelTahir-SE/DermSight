/**
 * Local PIN hash/verify logic.
 * Uses simple hashing with salt for offline PIN verification.
 */

import * as SecureStore from "expo-secure-store";

const PIN_SALT_KEY = "dermsight_pin_salt";

function generateSalt(): string {
  const array = new Uint8Array(16);
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getOrCreateSalt(): Promise<string> {
  let salt = await SecureStore.getItemAsync(PIN_SALT_KEY);
  if (!salt) {
    salt = generateSalt();
    await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
  }
  return salt;
}

/**
 * Hash a PIN with salt. Simple hash suitable for local-only PIN verification.
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = await getOrCreateSalt();
  const combined = salt + pin;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + ":" + salt.substring(0, 8);
}

/**
 * Verify a PIN against a stored hash.
 */
export async function verifyPin(
  pin: string,
  storedHash: string,
): Promise<boolean> {
  const salt = storedHash.split(":")[1];
  if (!salt) return false;
  const combined = await getOrCreateSalt();
  const fullSalt = combined;
  const input = fullSalt + pin;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const computed = Math.abs(hash).toString(36) + ":" + salt;
  return computed === storedHash;
}

/**
 * Check if a PIN has been set up.
 */
export async function isPinSet(): Promise<boolean> {
  const hash = await SecureStore.getItemAsync("dermsight_pin_hash");
  return hash !== null;
}
