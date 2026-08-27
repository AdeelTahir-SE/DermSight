-- ============================================================================
-- Migration 004: Functions & Analytics
-- Useful server-side functions for dashboards, reporting, and data integrity.
-- ============================================================================

-- ── Upsert patient from sync payload ───────────────────────────────────────
-- Called by the sync engine. Uses local_id + worker_id for deduplication.
-- Returns the remote UUID so the client can store it as remote_id.
CREATE OR REPLACE FUNCTION public.upsert_patient(
  p_local_id       TEXT,
  p_first_name     TEXT,
  p_last_name      TEXT,
  p_date_of_birth  DATE,
  p_sex            public.sex_enum,
  p_phone          TEXT DEFAULT NULL,
  p_address        TEXT DEFAULT NULL,
  p_notes          TEXT DEFAULT NULL,
  p_latitude       DOUBLE PRECISION DEFAULT NULL,
  p_longitude      DOUBLE PRECISION DEFAULT NULL,
  p_captured_at    TIMESTAMPTZ DEFAULT now()
)
RETURNS UUID AS $$
DECLARE
  v_worker_id UUID;
  v_patient_id UUID;
BEGIN
  -- Resolve worker from auth context
  v_worker_id := public.get_worker_id();
  IF v_worker_id IS NULL THEN
    RAISE EXCEPTION 'No health worker profile found for current user';
  END IF;

  INSERT INTO public.patients (
    local_id, first_name, last_name, date_of_birth, sex,
    phone, address, notes, latitude, longitude,
    captured_at, created_by, synced_at
  ) VALUES (
    p_local_id, p_first_name, p_last_name, p_date_of_birth, p_sex,
    p_phone, p_address, p_notes, p_latitude, p_longitude,
    p_captured_at, v_worker_id, now()
  )
  ON CONFLICT (created_by, local_id)
  DO UPDATE SET
    first_name   = EXCLUDED.first_name,
    last_name    = EXCLUDED.last_name,
    date_of_birth = EXCLUDED.date_of_birth,
    sex          = EXCLUDED.sex,
    phone        = EXCLUDED.phone,
    address      = EXCLUDED.address,
    notes        = EXCLUDED.notes,
    latitude     = EXCLUDED.latitude,
    longitude    = EXCLUDED.longitude,
    synced_at    = now();

  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE created_by = v_worker_id AND local_id = p_local_id;

  -- Log the sync
  INSERT INTO public.sync_log (worker_id, entity_type, entity_local_id, operation)
  VALUES (v_worker_id, 'patient', p_local_id, 'create');

  RETURN v_patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.upsert_patient IS 'Upserts a patient record from sync payload, returns remote UUID';

-- ── Upsert assessment from sync payload ────────────────────────────────────
-- Requires the patient to already exist remotely (via remote_id).
CREATE OR REPLACE FUNCTION public.upsert_assessment(
  p_local_id              TEXT,
  p_patient_local_id      TEXT,
  p_image_local_uri       TEXT,
  p_predicted_class       public.diagnosis_class_enum,
  p_class_probabilities   JSONB,
  p_abcd_asymmetry        DOUBLE PRECISION,
  p_abcd_border           DOUBLE PRECISION,
  p_abcd_color            DOUBLE PRECISION,
  p_abcd_diameter         DOUBLE PRECISION,
  p_risk_tier             public.risk_tier_enum,
  p_confidence_score      DOUBLE PRECISION,
  p_model_version         TEXT,
  p_image_remote_url      TEXT DEFAULT NULL,
  p_body_location         TEXT DEFAULT NULL,
  p_latitude              DOUBLE PRECISION DEFAULT NULL,
  p_longitude             DOUBLE PRECISION DEFAULT NULL,
  p_captured_at           TIMESTAMPTZ DEFAULT now()
)
RETURNS UUID AS $$
DECLARE
  v_worker_id   UUID;
  v_patient_id  UUID;
  v_assessment_id UUID;
BEGIN
  v_worker_id := public.get_worker_id();
  IF v_worker_id IS NULL THEN
    RAISE EXCEPTION 'No health worker profile found for current user';
  END IF;

  -- Resolve patient remote ID
  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE created_by = v_worker_id AND local_id = p_patient_local_id;

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Patient with local_id % not found. Sync patient first.', p_patient_local_id;
  END IF;

  INSERT INTO public.assessments (
    local_id, patient_id, image_local_uri, image_remote_url,
    predicted_class, class_probabilities,
    abcd_asymmetry, abcd_border, abcd_color, abcd_diameter,
    risk_tier, confidence_score, model_version,
    body_location, latitude, longitude,
    captured_at, created_by, synced_at
  ) VALUES (
    p_local_id, v_patient_id, p_image_local_uri, p_image_remote_url,
    p_predicted_class, p_class_probabilities,
    p_abcd_asymmetry, p_abcd_border, p_abcd_color, p_abcd_diameter,
    p_risk_tier, p_confidence_score, p_model_version,
    p_body_location, p_latitude, p_longitude,
    p_captured_at, v_worker_id, now()
  )
  ON CONFLICT (created_by, local_id)
  DO UPDATE SET
    image_remote_url    = COALESCE(EXCLUDED.image_remote_url, public.assessments.image_remote_url),
    predicted_class     = EXCLUDED.predicted_class,
    class_probabilities = EXCLUDED.class_probabilities,
    abcd_asymmetry      = EXCLUDED.abcd_asymmetry,
    abcd_border         = EXCLUDED.abcd_border,
    abcd_color          = EXCLUDED.abcd_color,
    abcd_diameter       = EXCLUDED.abcd_diameter,
    risk_tier           = EXCLUDED.risk_tier,
    confidence_score    = EXCLUDED.confidence_score,
    synced_at           = now();

  SELECT id INTO v_assessment_id
  FROM public.assessments
  WHERE created_by = v_worker_id AND local_id = p_local_id;

  -- Log the sync
  INSERT INTO public.sync_log (worker_id, entity_type, entity_local_id, operation)
  VALUES (v_worker_id, 'assessment', p_local_id, 'create');

  RETURN v_assessment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.upsert_assessment IS 'Upserts an assessment record from sync payload, returns remote UUID';

-- ── Worker dashboard stats ─────────────────────────────────────────────────
-- Returns summary statistics for the authenticated worker's dashboard.
CREATE OR REPLACE FUNCTION public.get_worker_stats()
RETURNS TABLE (
  total_patients      BIGINT,
  total_assessments   BIGINT,
  urgent_count        BIGINT,
  high_count          BIGINT,
  medium_count        BIGINT,
  low_count           BIGINT,
  assessments_today   BIGINT,
  last_assessment_at  TIMESTAMPTZ
) AS $$
DECLARE
  v_worker_id UUID;
BEGIN
  v_worker_id := public.get_worker_id();

  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.patients WHERE created_by = v_worker_id),
    (SELECT count(*) FROM public.assessments WHERE created_by = v_worker_id),
    (SELECT count(*) FROM public.assessments WHERE created_by = v_worker_id AND risk_tier = 'urgent_referral'),
    (SELECT count(*) FROM public.assessments WHERE created_by = v_worker_id AND risk_tier = 'high'),
    (SELECT count(*) FROM public.assessments WHERE created_by = v_worker_id AND risk_tier = 'medium'),
    (SELECT count(*) FROM public.assessments WHERE created_by = v_worker_id AND risk_tier = 'low'),
    (SELECT count(*) FROM public.assessments WHERE created_by = v_worker_id AND captured_at >= CURRENT_DATE),
    (SELECT max(captured_at) FROM public.assessments WHERE created_by = v_worker_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_worker_stats IS 'Returns dashboard statistics for the current health worker';

-- ── Recent assessments for dashboard ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_recent_assessments(p_limit INT DEFAULT 10)
RETURNS TABLE (
  assessment_id       UUID,
  patient_name        TEXT,
  predicted_class     public.diagnosis_class_enum,
  risk_tier           public.risk_tier_enum,
  confidence_score    DOUBLE PRECISION,
  captured_at         TIMESTAMPTZ
) AS $$
DECLARE
  v_worker_id UUID;
BEGIN
  v_worker_id := public.get_worker_id();

  RETURN QUERY
  SELECT
    a.id,
    (p.first_name || ' ' || p.last_name)::TEXT,
    a.predicted_class,
    a.risk_tier,
    a.confidence_score,
    a.captured_at
  FROM public.assessments a
  JOIN public.patients p ON p.id = a.patient_id
  WHERE a.created_by = v_worker_id
  ORDER BY a.captured_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_recent_assessments IS 'Returns the most recent assessments for dashboard display';
