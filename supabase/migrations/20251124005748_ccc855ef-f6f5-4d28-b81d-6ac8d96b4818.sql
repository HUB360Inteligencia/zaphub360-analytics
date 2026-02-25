-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  
  -- Plan limits
  max_contacts integer,
  max_events integer,
  max_messages_per_month integer,
  max_instances integer,
  max_users integer,
  max_storage_mb integer,
  
  -- Features
  features jsonb DEFAULT '[]'::jsonb,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Insert default plans
INSERT INTO public.subscription_plans (
  name, display_name, price_monthly,
  max_contacts, max_events, max_messages_per_month, 
  max_instances, max_users, features
) VALUES
  ('free', 'Gratuito', 0, 100, 2, 500, 1, 1, '["Suporte básico"]'::jsonb),
  ('starter', 'Iniciante', 97.00, 1000, 5, 5000, 2, 3, '["Suporte por email", "Análises básicas"]'::jsonb),
  ('professional', 'Profissional', 297.00, 10000, 20, 50000, 5, 10, '["Suporte prioritário", "Análises avançadas", "Domínio customizado"]'::jsonb),
  ('enterprise', 'Empresarial', 997.00, NULL, NULL, NULL, NULL, NULL, '["Suporte dedicado", "Features customizadas", "SLA garantido"]'::jsonb);

-- Add plan fields to organizations
ALTER TABLE public.organizations
ADD COLUMN plan_id uuid REFERENCES public.subscription_plans(id),
ADD COLUMN plan_started_at timestamptz,
ADD COLUMN plan_expires_at timestamptz,
ADD COLUMN usage_stats jsonb DEFAULT '{
  "contacts_count": 0,
  "events_count": 0,
  "messages_sent_this_month": 0,
  "instances_count": 0,
  "users_count": 0
}'::jsonb;

-- Set default plan for existing organizations
UPDATE public.organizations 
SET plan_id = (SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1),
    plan_started_at = now()
WHERE plan_id IS NULL;

-- Create functions to check limits
CREATE OR REPLACE FUNCTION public.can_create_contact(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  max_allowed integer;
BEGIN
  SELECT sp.max_contacts INTO max_allowed
  FROM organizations o
  JOIN subscription_plans sp ON sp.id = o.plan_id
  WHERE o.id = org_id;
  
  IF max_allowed IS NULL THEN
    RETURN true;
  END IF;
  
  SELECT COUNT(*) INTO current_count
  FROM contacts
  WHERE organization_id = org_id;
  
  RETURN current_count < max_allowed;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_create_event(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  max_allowed integer;
BEGIN
  SELECT sp.max_events INTO max_allowed
  FROM organizations o
  JOIN subscription_plans sp ON sp.id = o.plan_id
  WHERE o.id = org_id;
  
  IF max_allowed IS NULL THEN
    RETURN true;
  END IF;
  
  SELECT COUNT(*) INTO current_count
  FROM events
  WHERE organization_id = org_id;
  
  RETURN current_count < max_allowed;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_send_message(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  messages_this_month integer;
  max_allowed integer;
BEGIN
  SELECT sp.max_messages_per_month INTO max_allowed
  FROM organizations o
  JOIN subscription_plans sp ON sp.id = o.plan_id
  WHERE o.id = org_id;
  
  IF max_allowed IS NULL THEN
    RETURN true;
  END IF;
  
  SELECT COUNT(*) INTO messages_this_month
  FROM mensagens_enviadas
  WHERE organization_id = org_id
  AND data_envio >= date_trunc('month', now());
  
  RETURN messages_this_month < max_allowed;
END;
$$;

-- Create trigger to update contacts usage
CREATE OR REPLACE FUNCTION update_contacts_usage()
RETURNS trigger AS $$
BEGIN
  UPDATE organizations
  SET usage_stats = jsonb_set(
    usage_stats,
    '{contacts_count}',
    to_jsonb((SELECT COUNT(*) FROM contacts WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)))
  )
  WHERE id = COALESCE(NEW.organization_id, OLD.organization_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_usage_trigger
AFTER INSERT OR UPDATE OR DELETE ON contacts
FOR EACH ROW EXECUTE FUNCTION update_contacts_usage();

-- Create trigger to update events usage
CREATE OR REPLACE FUNCTION update_events_usage()
RETURNS trigger AS $$
BEGIN
  UPDATE organizations
  SET usage_stats = jsonb_set(
    usage_stats,
    '{events_count}',
    to_jsonb((SELECT COUNT(*) FROM events WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)))
  )
  WHERE id = COALESCE(NEW.organization_id, OLD.organization_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_usage_trigger
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION update_events_usage();

-- Create trigger to update instances usage
CREATE OR REPLACE FUNCTION update_instances_usage()
RETURNS trigger AS $$
BEGIN
  UPDATE organizations
  SET usage_stats = jsonb_set(
    usage_stats,
    '{instances_count}',
    to_jsonb((SELECT COUNT(*) FROM instances WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)))
  )
  WHERE id = COALESCE(NEW.organization_id, OLD.organization_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER instances_usage_trigger
AFTER INSERT OR UPDATE OR DELETE ON instances
FOR EACH ROW EXECUTE FUNCTION update_instances_usage();

-- RLS Policies for admin access
CREATE POLICY "SaaS admins can view all plans"
  ON public.subscription_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'saas_admin'
    )
  );

CREATE POLICY "SaaS admins can manage all plans"
  ON public.subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'saas_admin'
    )
  );

-- Allow organization users to view their own plan
CREATE POLICY "Users can view their organization plan"
  ON public.subscription_plans FOR SELECT
  USING (
    id IN (
      SELECT plan_id FROM organizations 
      WHERE id = get_user_organization_id()
    )
  );