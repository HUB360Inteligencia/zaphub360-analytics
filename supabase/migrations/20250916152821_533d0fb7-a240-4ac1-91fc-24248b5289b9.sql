-- Create the missing contacts table that the trigger is expecting
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  email TEXT,
  organization_id UUID,
  origin TEXT,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for the contacts table  
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for contacts
CREATE POLICY "Users can manage contacts in their organization" 
ON public.contacts 
FOR ALL 
USING (organization_id = get_user_organization_id());

-- Now update all NULL organization_id values in new_contact_event
UPDATE public.new_contact_event 
SET organization_id = 'dab1df41-884f-4bb8-969a-c062a6aa8038'
WHERE organization_id IS NULL;