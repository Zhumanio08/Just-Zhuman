-- ============================================================================
-- 08_username_lookup.sql
-- Secure username -> email lookup so users can sign in with EITHER their
-- email or their username.
--
-- Why an RPC and not a direct SELECT on public.users?
--   RLS only allows `authenticated` users to read public.users, but at login
--   time the visitor is still `anon`, so the client cannot resolve the email
--   itself. This SECURITY DEFINER function does the lookup server-side and
--   returns ONLY the email (never the whole row), rate-safe and minimal.
--
-- Run this file once in the Supabase SQL editor.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF p_username IS NULL OR btrim(p_username) = '' THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email
  FROM public.users
  WHERE lower(username) = lower(btrim(p_username))
  LIMIT 1;

  RETURN v_email;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

-- Anyone (including not-yet-logged-in visitors) may call it, but it only
-- ever reveals the email that matches the exact username they typed.
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated;