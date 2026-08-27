---
kind: external_dependency
name: Supabase — Postgres + Storage + Auth backend
slug: supabase
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
source_files:
    - src/lib/supabase.ts
    - .env.example
---

### Identity
Supabase is the remote backend for DermSight, providing a Postgres database (mirroring the local `patients` and `assessments` tables), object storage for lesion images, and authentication.

### Role in this repo
- **Auth**: Supabase Auth session is persisted and auto-refreshed via `@supabase/supabase-js` client config (`persistSession`, `autoRefreshToken`).
- **Data sync**: The out-of-the-box source of truth is local SQLite; Supabase is only touched by the sync engine to upsert patient/assessment rows and upload images after they are first created locally.
- **Storage**: Lesion images are uploaded to Supabase Storage; the resulting `image_remote_url` is written back into the assessment row after a successful sync.

### Integration points
- Client initialized in `src/lib/supabase.ts` using `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from environment variables (see `.env.example`).
- Auth API calls live in `src/features/auth/api.ts`; sync push/pull logic lives in `src/features/sync/syncEngine.ts`.
- Remote schema mirrors the local Drizzle schema: `patients`, `assessments`, plus Row Level Security policies scoped by health worker organization/region (recommended before pilot).

### Durable usage model
- Local-first: every write lands in SQLite first, then enqueues a `sync_queue` row. Network calls never block UI.
- Conflict rule (MVP): server-authoritative on pull, client-wins on push.
- Credentials are injected as Expo public env vars; do not hardcode keys in source.