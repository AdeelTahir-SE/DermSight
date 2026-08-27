/**
 * Sync engine — orchestrates outbox → Supabase push/pull.
 * UI never waits on network; all sync happens in background.
 */

import { db } from "@/db/client";
import { syncQueue } from "@/db/schema";
import { isConnected } from "@/lib/netinfo";
import type { SyncQueueItem } from "@/types";
import { eq } from "drizzle-orm";

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

  const pendingItems = getPendingSyncItems();
  let success = 0;
  let failed = 0;

  for (const item of pendingItems) {
    try {
      // Mark as in_progress
      db.update(syncQueue)
        .set({
          status: "in_progress",
          lastAttemptedAt: new Date().toISOString(),
        })
        .where(eq(syncQueue.id, item.id))
        .run();

      // TODO: Implement actual Supabase upload logic
      // For now, mark as done (mock sync success)
      await simulateSyncUpload(item);

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

async function simulateSyncUpload(_item: SyncQueueItem): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
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
