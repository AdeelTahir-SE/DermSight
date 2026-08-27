-- ============================================================================
-- Migration 003: Storage — Lesion Images Bucket
-- Creates a Supabase Storage bucket for lesion images uploaded from devices.
-- Images are organized by worker ID for isolation.
-- ============================================================================

-- ── Create the bucket ──────────────────────────────────────────────────────
-- Bucket is private — access controlled via RLS policies below.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesion-images',
  'lesion-images',
  false,
  10485760,  -- 10 MB max per image
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Storage RLS Policies
-- ============================================================================

-- Enable RLS on storage objects for our bucket
-- Note: Supabase Storage uses storage.objects table internally.

-- Workers can upload images to their own folder
-- Path pattern: {worker_id}/{assessment_local_id}.jpg
CREATE POLICY lesion_images_upload
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesion-images'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  );

-- Workers can read images from their own folder
CREATE POLICY lesion_images_select_own
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'lesion-images'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  );

-- Workers can update (re-upload) images in their own folder
CREATE POLICY lesion_images_update_own
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lesion-images'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'lesion-images'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  );

-- Workers can delete images from their own folder
CREATE POLICY lesion_images_delete_own
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lesion-images'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM public.health_workers WHERE supabase_user_id = auth.uid()
    )
  );
