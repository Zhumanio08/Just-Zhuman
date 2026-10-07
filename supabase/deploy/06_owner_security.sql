-- ============================================================================
-- 06_owner_security.sql
-- 1) Grants owner rights to the blog creator (username: Zhuman.io)
-- 2) Locks is_owner down so NO client can ever self-assign it again
--
-- HOW TO RUN:
--   1. Make sure "Zhuman.io" has signed up at least once (the user must exist).
--   2. Open Supabase Dashboard -> SQL Editor, paste this file, run it.
--   3. Log out and log back in on the site so your session picks up the flag.
--
-- NOTE:
--   After this script, is_owner can only be granted by running SQL as the
--   postgres role (i.e. in the SQL Editor). It can never be set through the
--   public API, at signup, or by updating your own profile row.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Grant owner to Zhuman.io
-- ---------------------------------------------------------------------------

-- 1a. Public users table
DO $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.users
  SET is_owner = TRUE
  WHERE lower(username) = lower('Zhuman.io');

  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    RAISE WARNING 'No user "Zhuman.io" found in public.users. Sign up first, then re-run this script.';
  ELSE
    RAISE NOTICE 'Granted is_owner=TRUE to % row(s) in public.users.', affected;
  END IF;
END $$;

-- 1b. Auth metadata (this is what the app reads for the owner UI)
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('is_owner', TRUE)
WHERE id IN (
  SELECT id FROM public.users WHERE lower(username) = lower('Zhuman.io')
);

-- 1c. Revoke owner from EVERYONE else (undo accounts that ticked the checkbox)
UPDATE public.users
SET is_owner = FALSE
WHERE lower(username) <> lower('Zhuman.io');

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('is_owner', FALSE)
WHERE lower(coalesce(raw_user_meta_data ->> 'is_owner', '')) IN ('true', 't', '1')
  AND id NOT IN (
    SELECT id FROM public.users WHERE lower(username) = lower('Zhuman.io')
  );

-- ---------------------------------------------------------------------------
-- 2. New signups can NEVER set is_owner = true (public.users)
--    Covers direct PostgREST inserts.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.force_new_user_not_owner()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_owner := FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_no_self_owner_insert ON public.users;
CREATE TRIGGER trg_users_no_self_owner_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.force_new_user_not_owner();

-- ---------------------------------------------------------------------------
-- 3. Users can NEVER escalate their own is_owner (public.users)
--    RLS allows users to UPDATE their own row, so block the flag here.
--    Grants are allowed only from the SQL Editor / service role.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.block_owner_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_owner IS TRUE AND OLD.is_owner IS FALSE
     AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    NEW.is_owner := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_block_owner_escalation ON public.users;
CREATE TRIGGER trg_users_block_owner_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.block_owner_escalation();

-- ---------------------------------------------------------------------------
-- 4. Signup metadata can NEVER carry is_owner = true (auth.users)
--    Supabase user_metadata is client-writable by design, so strip it at
--    INSERT for everyone. The legitimate grant happens in section 1b (UPDATE).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.strip_owner_flag_on_auth_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF lower(coalesce(NEW.raw_user_meta_data ->> 'is_owner', '')) IN ('true', 't', '1') THEN
    NEW.raw_user_meta_data := NEW.raw_user_meta_data || '{"is_owner": false}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auth_users_strip_owner_insert ON auth.users;
CREATE TRIGGER trg_auth_users_strip_owner_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.strip_owner_flag_on_auth_insert();

-- ---------------------------------------------------------------------------
-- 5. Metadata can NEVER be escalated to owner after signup (auth.users)
--    Blocks e.g. supabase.auth.updateUser({ data: { is_owner: true } }).
--    Grants allowed only from the SQL Editor (postgres) / service role.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.block_owner_escalation_on_auth()
RETURNS TRIGGER AS $$
BEGIN
  IF lower(coalesce(NEW.raw_user_meta_data ->> 'is_owner', '')) IN ('true', 't', '1')
     AND lower(coalesce(OLD.raw_user_meta_data ->> 'is_owner', '')) NOT IN ('true', 't', '1')
     AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    NEW.raw_user_meta_data := NEW.raw_user_meta_data || '{"is_owner": false}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auth_users_block_owner_escalation ON auth.users;
CREATE TRIGGER trg_auth_users_block_owner_escalation
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.block_owner_escalation_on_auth();

-- ============================================================================
-- Verification (run after the grants above):
--   SELECT username, is_owner FROM public.users WHERE lower(username) = lower('Zhuman.io');
--   SELECT raw_user_meta_data ->> 'is_owner' FROM auth.users
--   WHERE id IN (SELECT id FROM public.users WHERE lower(username) = lower('Zhuman.io'));
-- ============================================================================
