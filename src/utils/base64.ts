/**
 * Base64 decoding utilities that work in React Native / Hermes without
 * relying on the global `atob` polyfill.
 */

const CHAR_TABLE =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Decode a base64 string into a Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const normalized = base64.replace(/[^A-Za-z0-9+/=]/g, "");
  const output: number[] = [];
  let buffer = 0;
  let bitsCollected = 0;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const value = CHAR_TABLE.indexOf(char);
    if (value === -1) continue;

    buffer = (buffer << 6) | value;
    bitsCollected += 6;

    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      output.push((buffer >> bitsCollected) & 0xff);
    }
  }

  return new Uint8Array(output);
}

/**
 * Encode a Uint8Array to a base64 string.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let output = "";
  let buffer = 0;
  let bitsCollected = 0;

  for (let i = 0; i < bytes.length; i++) {
    buffer = (buffer << 8) | bytes[i];
    bitsCollected += 8;

    while (bitsCollected >= 6) {
      bitsCollected -= 6;
      output += CHAR_TABLE[(buffer >> bitsCollected) & 0x3f];
    }
  }

  if (bitsCollected > 0) {
    buffer <<= 6 - bitsCollected;
    output += CHAR_TABLE[buffer & 0x3f];
    while (bitsCollected < 6) {
      output += "=";
      bitsCollected += 2;
    }
  }

  return output;
}
