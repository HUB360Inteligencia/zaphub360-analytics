-- Temporarily disable the trigger that's causing issues
ALTER TABLE public.new_contact_event DISABLE TRIGGER trigger_sync_event_contact_trigger;

-- Update all NULL organization_id values in new_contact_event to the specified organization ID
UPDATE public.new_contact_event 
SET organization_id = 'dab1df41-884f-4bb8-969a-c062a6aa8038'
WHERE organization_id IS NULL;

-- Re-enable the trigger (though it may still fail due to missing contacts table)
ALTER TABLE public.new_contact_event ENABLE TRIGGER trigger_sync_event_contact_trigger;