-- Security Fix Phase 1: Critical RLS Policy Fixes

-- Enable RLS on campanha_instancia table
ALTER TABLE public.campanha_instancia ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for campanha_instancia
CREATE POLICY "Users can view campaign instances from their organization"
ON public.campanha_instancia
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campanha_instancia.id_campanha 
    AND c.organization_id = get_user_organization_id()
  )
);

CREATE POLICY "Users can manage campaign instances in their organization"
ON public.campanha_instancia
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campanha_instancia.id_campanha 
    AND c.organization_id = get_user_organization_id()
  )
);

-- Enable RLS on mensagens_enviadas table
ALTER TABLE public.mensagens_enviadas ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for mensagens_enviadas
CREATE POLICY "Users can view messages from their organization instances"
ON public.mensagens_enviadas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.instances i 
    WHERE i.id = mensagens_enviadas.instancia_id 
    AND i.organization_id = get_user_organization_id()
  )
);

CREATE POLICY "Users can manage messages from their organization instances"
ON public.mensagens_enviadas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.instances i 
    WHERE i.id = mensagens_enviadas.instancia_id 
    AND i.organization_id = get_user_organization_id()
  )
);

-- Fix overly permissive public policies on events and event_messages
-- Remove public access policies and keep only organization-based ones
DROP POLICY IF EXISTS "Public access to basic event data" ON public.events;
DROP POLICY IF EXISTS "Public access to event analytics data" ON public.event_messages;

-- Secure database functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_id uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN (
    SELECT organization_id FROM public.profiles 
    WHERE id = user_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_saas_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'saas_admin'
  );
END;
$function$;

-- Update instances table to hide API keys in normal queries
-- Create a view for instances without sensitive data
CREATE OR REPLACE VIEW public.instances_safe AS
SELECT 
  id,
  name,
  phone_number,
  status,
  organization_id,
  api_url,
  created_at,
  updated_at,
  CASE 
    WHEN api_key IS NOT NULL THEN '***configured***'
    ELSE NULL
  END as api_key_status
FROM public.instances;

-- Grant appropriate permissions on the view
GRANT SELECT ON public.instances_safe TO authenticated;

-- Add RLS policy for the view
ALTER VIEW public.instances_safe SET (security_barrier = true);

-- Create a secure function to get API key only when needed
CREATE OR REPLACE FUNCTION public.get_instance_api_key(instance_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  api_key_value text;
  user_org_id uuid;
BEGIN
  -- Get user's organization
  user_org_id := get_user_organization_id();
  
  -- Check if user has access to this instance
  SELECT api_key INTO api_key_value
  FROM public.instances 
  WHERE id = instance_id 
    AND organization_id = user_org_id;
    
  RETURN api_key_value;
END;
$function$;