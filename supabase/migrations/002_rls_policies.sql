-- ============================================================================
-- Migration 002: Row Level Security (RLS)
-- Ensures health workers can only access their own data.
-- All policies use auth.uid() to identify the current user.
-- ============================================================================

-- ── Enable RLS on all tables ───────────────────────────────────────────────
ALTER TABLE public.health_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log       ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Health Workers
-- ============================================================================

-- Workers can read their own profile
CREATE POLICY health_workers_select_own
  ON public.health_workers
  FOR SELECT
  TO authenticated
  USING (supabase_user_id = auth.uid());

-- Workers can update their own profile (e.g. name, region changes)
CREATE POLICY health_workers_update_own
  ON public.health_workers
  FOR UPDATE
  TO authenticated
  USING (supabase_user_id = auth.uid())
  WITH CHECK (supabase_user_id = auth.uid());

-- Workers can insert their own profile (first-time registration)
CREATE POLICY health_workers_insert_own
  ON public.health_workers
  FOR INSERT
  TO authenticated
  WITH CHECK (supabase_user_id = auth.uid());

-- ============================================================================
-- Patients
-- ============================================================================

-- Workers can read patients they created
CREATE POLICY patients_select_own
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (
    created_by = (
      SELECT id FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  );

-- Workers can insert patients they created
CREATE POLICY patients_insert_own
  ON public.patients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (
      SELECT id FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  );

-- Workers can update patients they created
CREATE POLICY patients_update_own
  ON public.patients
  FOR UPDATE
  TO authenticated
  USING (
    created_by = (
      SELECT id FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = (
      SELECT id FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  );

-- ============================================================================
-- Assessments
-- ============================================================================

-- Workers can read assessments they created
CREATE POLICY assessments_select_own
  ON public.assessments
  FOR SELECT
  TO authenticated
  USING (
    created_by = (
      SELECT id FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  );

-- Workers can insert assessments they created
CREATE POLICY assessments_insert_own
  ON public.assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (
      SELECT id FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  );

-- Workers can update assessments they created (e.g. adding image_remote_url after upload)
CREATE POLICY assessments_update_own
  ON public.assessments
  FOR UPDATE
  TO authenticated
  USING (
    created_by = (
      SELECT id FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = (
      SELECT id FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  );

-- ============================================================================
-- Sync Log
-- ============================================================================

-- Workers can read their own sync log entries
CREATE POLICY sync_log_select_own
  ON public.sync_log
  FOR SELECT
  TO authenticated
  USING (
    worker_id = (
      SELECT id FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  );

-- Workers can insert sync log entries
CREATE POLICY sync_log_insert_own
  ON public.sync_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    worker_id = (
      SELECT id FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  );

-- ============================================================================
-- Helper function for getting worker_id from auth context
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_worker_id()
RETURNS UUID AS $$
  SELECT id FROM public.health_workers WHERE supabase_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_worker_id IS 'Returns the health worker ID for the current authenticated user';
