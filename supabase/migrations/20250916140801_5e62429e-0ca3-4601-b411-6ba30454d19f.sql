-- Drop the contacts table since we're centralizing on new_contact_event
-- First, remove dependent objects
DROP TABLE IF EXISTS contact_tags CASCADE;

-- Drop the contacts table  
DROP TABLE IF EXISTS contacts CASCADE;

-- Add indexes to new_contact_event for better performance
CREATE INDEX IF NOT EXISTS idx_new_contact_event_organization_id ON new_contact_event(organization_id);
CREATE INDEX IF NOT EXISTS idx_new_contact_event_celular ON new_contact_event(celular);
CREATE INDEX IF NOT EXISTS idx_new_contact_event_name ON new_contact_event(name);
CREATE INDEX IF NOT EXISTS idx_new_contact_event_cidade ON new_contact_event(cidade);
CREATE INDEX IF NOT EXISTS idx_new_contact_event_bairro ON new_contact_event(bairro);
CREATE INDEX IF NOT EXISTS idx_new_contact_event_sentimento ON new_contact_event(sentimento);
CREATE INDEX IF NOT EXISTS idx_new_contact_event_status_envio ON new_contact_event(status_envio);