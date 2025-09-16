-- Update all NULL organization_id values in new_contact_event to the specified organization ID
UPDATE public.new_contact_event 
SET organization_id = 'dab1df41-884f-4bb8-969a-c062a6aa8038'
WHERE organization_id IS NULL;