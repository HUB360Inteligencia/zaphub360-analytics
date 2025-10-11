-- Enforce invite-only signup and create access_requests with RLS

-- Function to enforce invite-only signup before inserting into auth.users
CREATE OR REPLACE FUNCTION public.enforce_invite_only_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := current_setting('request.jwt.claims', true)::jsonb->>'role';
  v_invite_token TEXT := NEW.raw_user_meta_data->>'invite_token';
BEGIN
  -- Allow service_role bypass (admin operations)
  IF v_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Require invite_token for self-signup
  IF v_invite_token IS NULL THEN
    RAISE EXCEPTION 'Signup requires an invitation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_invite_only_signup ON auth.users;
CREATE TRIGGER enforce_invite_only_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION enforce_invite_only_signup();

-- Enable RLS on invitations and provide secure RPC to read by token
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token TEXT)
RETURNS TABLE (
  email TEXT,
  role TEXT,
  token TEXT,
  organization_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT i.email,
         i.role,
         i.token,
         o.name AS organization_name
  FROM invitations i
  JOIN organizations o ON o.id = i.organization_id
  WHERE i.token = p_token
    AND i.status = 'pending'
    AND i.expires_at > NOW();
END;
$$;

-- Access requests table for controlled onboarding
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  organization_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT access_requests_status_check CHECK (status IN ('pending','approved','rejected')),
  CONSTRAINT access_requests_requested_by_fk FOREIGN KEY (requested_by) REFERENCES auth.users(id)
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon or authenticated) to submit access requests
CREATE POLICY access_requests_insert_any ON public.access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service_role can read/update access requests by default (no public select/update policies)