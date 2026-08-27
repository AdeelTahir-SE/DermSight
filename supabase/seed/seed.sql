-- ============================================================================
-- Seed Data — Development / Testing
-- Run after migrations: supabase db seed or via SQL editor
-- Creates a test health worker, sample patients, and assessments.
-- ============================================================================

-- ── Create a test auth user ────────────────────────────────────────────────
-- Note: In Supabase local dev, you can create users via the Auth API.
-- This assumes a test user with a known UUID exists.
-- Replace with your actual test user UUID from Supabase Auth.
-- DO NOT run this in production — use Supabase Auth UI or API instead.

-- For local development only (Supabase CLI `supabase start`):
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'test@dermsight.dev',
--   '$2a$10$placeholder_hash_replace_me',
--   now()
-- ) ON CONFLICT (id) DO NOTHING;

-- ── Health Worker ──────────────────────────────────────────────────────────
-- Replace the supabase_user_id with the actual auth user UUID above
INSERT INTO public.health_workers (id, supabase_user_id, full_name, region)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Dr. Amina Hassan',
  'Dar es Salaam'
) ON CONFLICT (id) DO NOTHING;

-- ── Sample Patients ────────────────────────────────────────────────────────
INSERT INTO public.patients (id, local_id, first_name, last_name, date_of_birth, sex, phone, captured_at, created_by)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'local-patient-001',
   'Grace', 'Mwangi', '1985-03-15', 'female', '+255712345678',
   now() - INTERVAL '5 days', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'local-patient-002',
   'Joseph', 'Okafor', '1972-11-28', 'male', '+255798765432',
   now() - INTERVAL '3 days', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000003', 'local-patient-003',
   'Fatima', 'Bakari', '1990-07-04', 'female', NULL,
   now() - INTERVAL '1 day', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000004', 'local-patient-004',
   'David', 'Kimani', '1968-01-20', 'male', '+255755555555',
   now() - INTERVAL '12 hours', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ── Sample Assessments ─────────────────────────────────────────────────────
INSERT INTO public.assessments (
  id, local_id, patient_id, image_local_uri, predicted_class,
  class_probabilities, abcd_asymmetry, abcd_border, abcd_color, abcd_diameter,
  risk_tier, confidence_score, model_version, captured_at, created_by
)
VALUES
  -- Urgent: Melanoma for Grace
  ('c0000000-0000-0000-0000-000000000001', 'local-assessment-001',
   'b0000000-0000-0000-0000-000000000001',
   'file:///data/lesion_001.jpg', 'mel',
   '{"mel": 0.72, "bcc": 0.08, "akiec": 0.06, "bkl": 0.04, "df": 0.03, "vasc": 0.02, "nv": 0.05}',
   0.82, 0.75, 0.68, 0.90,
   'urgent_referral', 0.72, 'h-cbm-v1.0.0',
   now() - INTERVAL '5 days', 'a0000000-0000-0000-0000-000000000001'),

  -- High: BCC for Joseph
  ('c0000000-0000-0000-0000-000000000002', 'local-assessment-002',
   'b0000000-0000-0000-0000-000000000002',
   'file:///data/lesion_002.jpg', 'bcc',
   '{"mel": 0.05, "bcc": 0.65, "akiec": 0.12, "bkl": 0.08, "df": 0.04, "vasc": 0.03, "nv": 0.03}',
   0.45, 0.62, 0.38, 0.55,
   'high', 0.65, 'h-cbm-v1.0.0',
   now() - INTERVAL '3 days', 'a0000000-0000-0000-0000-000000000001'),

  -- Low: Nevus for Fatima
  ('c0000000-0000-0000-0000-000000000003', 'local-assessment-003',
   'b0000000-0000-0000-0000-000000000003',
   'file:///data/lesion_003.jpg', 'nv',
   '{"mel": 0.02, "bcc": 0.03, "akiec": 0.02, "bkl": 0.05, "df": 0.03, "vasc": 0.05, "nv": 0.80}',
   0.15, 0.12, 0.18, 0.22,
   'low', 0.80, 'h-cbm-v1.0.0',
   now() - INTERVAL '1 day', 'a0000000-0000-0000-0000-000000000001'),

  -- Medium: BKL for David
  ('c0000000-0000-0000-0000-000000000004', 'local-assessment-004',
   'b0000000-0000-0000-0000-000000000004',
   'file:///data/lesion_004.jpg', 'bkl',
   '{"mel": 0.03, "bcc": 0.04, "akiec": 0.05, "bkl": 0.62, "df": 0.12, "vasc": 0.06, "nv": 0.08}',
   0.35, 0.42, 0.30, 0.48,
   'medium', 0.62, 'h-cbm-v1.0.0',
   now() - INTERVAL '12 hours', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ── Verify seed data ───────────────────────────────────────────────────────
-- Uncomment to check after seeding:
-- SELECT 'Workers:     ' || count(*) FROM public.health_workers
-- UNION ALL
-- SELECT 'Patients:    ' || count(*) FROM public.patients
-- UNION ALL
-- SELECT 'Assessments: ' || count(*) FROM public.assessments;
