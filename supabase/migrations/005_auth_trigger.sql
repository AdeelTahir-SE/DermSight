-- ============================================================================
-- Migration 005: Auth Trigger
-- Automatically inserts a health worker profile into public.health_workers
-- when a new user registers in auth.users, using options.data metadata.
-- Bypasses client-side RLS insert checks when email confirmation is required.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.health_workers (supabase_user_id, full_name, region)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Health Worker'),
    COALESCE(NEW.raw_user_meta_data->>'region', 'Local')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute handle_new_user AFTER an auth.user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
