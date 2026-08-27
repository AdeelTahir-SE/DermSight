---
kind: error_handling
name: Error Handling in DermSight — Local-first with Out-of-Band Sync and UI-Level Graceful Degradation
category: error_handling
scope:
    - '**'
source_files:
    - src/features/auth/api.ts
    - src/features/auth/store.ts
    - src/features/sync/syncEngine.ts
    - src/features/patients/validation.ts
    - src/hooks/useConnectivity.ts
    - src/components/ui/ConnectivityBanner.tsx
    - src/lib/netinfo.ts
    - src/app/_layout.tsx
    - src/lib/supabase.ts
---

## Overview

DermSight is an offline-first React Native/Expo app. Error handling follows the principle that **local SQLite is the single source of truth** and network operations are background, best-effort syncs. Errors are handled at three layers: (1) per-operation try/catch in feature stores, (2) a retry-with-backoff outbox queue for sync failures, and (3) UI-level graceful degradation via connectivity banners and loading states. There is no centralized error type hierarchy, no custom `Error` subclasses, and no global error boundary beyond the root layout.

## Layer 1 — Feature-layer try/catch with boolean or state return values

Most feature functions do not throw; they swallow errors and return booleans or mutate Zustand store state to reflect failure:

- `src/features/auth/store.ts`: `loginWithPin`, `setupPIN`, and `initialize` wrap their async work in try/catch blocks. On success they set `isAuthenticated`, `pinSet`, etc.; on any exception they reset `isLoading` to false and return `false` or simply continue initialization. The catch block is intentionally broad (`catch { ... }`) — it does not inspect the error value.
- `src/features/sync/syncEngine.ts`: `retrySyncItem` returns `true` on success and `false` on any DB update failure.

This pattern keeps the UI from having to handle thrown exceptions for local operations; instead it reads store flags (`isLoading`, `isAuthenticated`, `isInitialized`).

## Layer 2 — Network calls rethrow library errors up to callers

The only place where errors are allowed to propagate upward is the thin Supabase auth API wrapper:

- `src/features/auth/api.ts`: Each function (`signInWithEmail`, `signOut`, `getCurrentSession`, `refreshSession`) destructures `{ data, error }` from the Supabase client call and `throw error` when present. This converts Supabase's result-object error into a thrown JS `Error`, letting callers use standard try/catch.

There is no custom error class wrapping these — the raw Supabase error object is rethrown verbatim.

## Layer 3 — Background sync outbox with retry + backoff

The sync engine (`src/features/sync/syncEngine.ts`) implements the core resilience strategy:

- A `syncQueue` table in SQLite holds pending/outbox items with fields `status` (`pending`, `in_progress`, `done`, `failed`), `attemptCount`, and `lastAttemptedAt`.
- `runSync()` iterates pending items, marks each `in_progress`, attempts upload (currently mocked via `simulateSyncUpload`), then marks `done`. On any caught exception it increments `attemptCount`, transitions to `failed` after `MAX_RETRIES = 5`, otherwise stays `pending`, and applies exponential backoff (`BASE_DELAY_MS * 2^attemptCount`, capped at 30s).
- Offline detection short-circuits the whole run: if `isConnected()` is false, all pending items are counted as `skipped` and none are attempted.

This makes sync failures **non-fatal** — the app continues working locally while the outbox retries later.

## Layer 4 — UI-level graceful degradation

Errors and degraded states surface through UI components rather than alerts:

- `src/components/ui/ConnectivityBanner.tsx` uses `useConnectivity()` to show a persistent amber banner when offline, informing users that data will sync automatically.
- `src/hooks/useConnectivity.ts` wraps NetInfo subscriptions to expose `isConnected` / `isOffline` state.
- Root layout (`src/app/_layout.tsx`) bootstraps DB and auth in a try/catch; on bootstrap failure it logs via `console.error("Bootstrap error:", e)` but still renders the app shell so the user can navigate.

## Validation errors

Form input validation uses Zod schemas (`src/features/patients/validation.ts`): `patientFormSchema` defines required fields, date format regex, and enum constraints with custom error messages (e.g. `"First name is required"`, `"Must be YYYY-MM-DD format"`, `"Please select a gender"`). These produce Zod `ZodError` objects consumed by form libraries; there is no cross-cutting error formatter.

## Conventions observed

- **Local operations never throw**: feature stores catch broadly and translate failures into store state changes or boolean returns.
- **Network wrappers rethrow**: the Supabase auth API layer converts result-object errors into thrown errors so callers can use try/catch.
- **Sync failures are retried, not surfaced**: the outbox queue persists failures and retries with exponential backoff; the UI is not notified per-item.
- **No custom error types**: the codebase does not define domain-specific error classes or sentinel errors — it relies on native `Error`, Supabase error objects, and Zod errors.
- **Logging over alerting**: unhandled bootstrap errors go to `console.error`; there are no toast/alert/error modal patterns in the codebase.
- **Offline-first UX**: connectivity state drives UI banners and sync gating rather than blocking user flows.

## Key files

- `src/features/auth/api.ts` — throws Supabase errors from auth calls
- `src/features/auth/store.ts` — catches errors in PIN/local auth, returns booleans
- `src/features/sync/syncEngine.ts` — outbox retry loop with backoff and status transitions
- `src/features/patients/validation.ts` — Zod schema-based validation errors
- `src/hooks/useConnectivity.ts` — connectivity state hook
- `src/components/ui/ConnectivityBanner.tsx` — offline UI indicator
- `src/lib/netinfo.ts` — NetInfo subscription wrapper
- `src/app/_layout.tsx` — root bootstrap error logging
- `src/lib/supabase.ts` — Supabase client (used by auth API)

## Constraints & rules enforced by implementation

- Sync queue items must transition through `pending → in_progress → done|failed` (enforced by `runSync`'s update sequence).
- Retry count is capped at `MAX_RETRIES = 5`; beyond that, items permanently move to `failed`.
- Backoff delay is exponential with a 30-second cap.
- Form submissions must conform to `patientFormSchema` before being persisted (enforced by Zod).
- Auth API callers must handle thrown errors from `api.ts` functions; the store layer swallows them instead.