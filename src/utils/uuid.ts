/**
 * UUID generation — offline-safe, no crypto dependency.
 * Uses Math.random with timestamp for sufficient uniqueness in local-first context.
 */

export function generateUUID(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const randomPart2 = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
