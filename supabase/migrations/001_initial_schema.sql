-- ============================================================================
-- Migration 001: Core Tables
-- Creates the remote PostgreSQL schema mirroring the local SQLite database.
-- Local-only tables (sync_queue, model_versions) are NOT replicated here.
-- ============================================================================

-- Enable UUID extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enum Types ─────────────────────────────────────────────────────────────
CREATE TYPE public.sex_enum AS ENUM ('male', 'female', 'other');
CREATE TYPE public.diagnosis_class_enum AS ENUM ('mel', 'bcc', 'akiec', 'bkl', 'df', 'vasc', 'nv');
CREATE TYPE public.risk_tier_enum AS ENUM ('low', 'medium', 'high', 'urgent_referral');
CREATE TYPE public.sync_status_enum AS ENUM ('pending', 'synced', 'failed');

-- ── Health Workers ─────────────────────────────────────────────────────────
-- Mirrors local `users` table. Linked to auth.users via supabase_user_id.
-- PIN hash stays local-only (expo-secure-store) — never synced to remote.
CREATE TABLE public.health_workers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  region          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.health_workers IS 'Community health workers who use the DermSight app';
COMMENT ON COLUMN public.health_workers.supabase_user_id IS 'FK to Supabase Auth user';

CREATE UNIQUE INDEX idx_health_workers_supabase_user
  ON public.health_workers (supabase_user_id);

CREATE INDEX idx_health_workers_region
  ON public.health_workers (region);

-- ── Patients ───────────────────────────────────────────────────────────────
-- Synced from local SQLite. Uses local_id as the stable identifier
-- so re-syncs can upsert without creating duplicates.
CREATE TABLE public.patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id        TEXT NOT NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  date_of_birth   DATE NOT NULL,
  sex             public.sex_enum NOT NULL,
  phone           TEXT,
  address         TEXT,
  notes           TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  captured_at     TIMESTAMPTZ NOT NULL,
  created_by      UUID NOT NULL REFERENCES public.health_workers(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at       TIMESTAMPTZ
);

COMMENT ON TABLE public.patients IS 'Patient records synced from health worker devices';
COMMENT ON COLUMN public.patients.local_id IS 'UUID generated on-device, used for deduplication';

-- Unique per (worker, local_id) to prevent duplicate syncs
CREATE UNIQUE INDEX idx_patients_worker_local
  ON public.patients (created_by, local_id);

CREATE INDEX idx_patients_created_by
  ON public.patients (created_by);

CREATE INDEX idx_patients_captured_at
  ON public.patients (captured_at DESC);

CREATE INDEX idx_patients_name_search
  ON public.patients USING gin (
    to_tsvector('simple', coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
  );

-- ── Assessments ────────────────────────────────────────────────────────────
-- Lesion screening results. image_remote_url points to Supabase Storage.
CREATE TABLE public.assessments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id              TEXT NOT NULL,
  patient_id            UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  image_local_uri       TEXT NOT NULL,
  image_remote_url      TEXT,
  predicted_class       public.diagnosis_class_enum NOT NULL,
  class_probabilities   JSONB NOT NULL,
  abcd_asymmetry        DOUBLE PRECISION NOT NULL CHECK (abcd_asymmetry >= 0 AND abcd_asymmetry <= 1),
  abcd_border           DOUBLE PRECISION NOT NULL CHECK (abcd_border >= 0 AND abcd_border <= 1),
  abcd_color            DOUBLE PRECISION NOT NULL CHECK (abcd_color >= 0 AND abcd_color <= 1),
  abcd_diameter         DOUBLE PRECISION NOT NULL CHECK (abcd_diameter >= 0 AND abcd_diameter <= 1),
  risk_tier             public.risk_tier_enum NOT NULL,
  confidence_score      DOUBLE PRECISION NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  model_version         TEXT NOT NULL,
  body_location         TEXT,
  latitude              DOUBLE PRECISION,
  longitude             DOUBLE PRECISION,
  captured_at           TIMESTAMPTZ NOT NULL,
  created_by            UUID NOT NULL REFERENCES public.health_workers(id) ON DELETE RESTRICT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at             TIMESTAMPTZ
);

COMMENT ON TABLE public.assessments IS 'Lesion assessment results with ABCD explainability scores';
COMMENT ON COLUMN public.assessments.local_id IS 'UUID generated on-device, used for deduplication';
COMMENT ON COLUMN public.assessments.class_probabilities IS 'JSON object mapping diagnosis class to probability (0-1)';

-- Unique per (worker, local_id) to prevent duplicate syncs
CREATE UNIQUE INDEX idx_assessments_worker_local
  ON public.assessments (created_by, local_id);

CREATE INDEX idx_assessments_patient
  ON public.assessments (patient_id);

CREATE INDEX idx_assessments_created_by
  ON public.assessments (created_by);

CREATE INDEX idx_assessments_risk_tier
  ON public.assessments (risk_tier);

CREATE INDEX idx_assessments_captured_at
  ON public.assessments (captured_at DESC);

-- ── Sync Log (server-side audit trail) ────────────────────────────────────
-- Optional: tracks sync operations for debugging and monitoring.
CREATE TABLE public.sync_log (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  worker_id       UUID NOT NULL REFERENCES public.health_workers(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('patient', 'assessment')),
  entity_local_id TEXT NOT NULL,
  operation       TEXT NOT NULL CHECK (operation IN ('create', 'update')),
  status          TEXT NOT NULL DEFAULT 'success',
  error_message   TEXT,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sync_log IS 'Server-side audit log of all sync operations';

CREATE INDEX idx_sync_log_worker
  ON public.sync_log (worker_id);

CREATE INDEX idx_sync_log_synced_at
  ON public.sync_log (synced_at DESC);

-- ── Updated At Trigger ─────────────────────────────────────────────────────
-- Automatically updates updated_at on row modification.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_health_workers_updated_at
  BEFORE UPDATE ON public.health_workers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
