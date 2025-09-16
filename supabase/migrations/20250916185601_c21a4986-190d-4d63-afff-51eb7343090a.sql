-- Adicionar campos de mídia na tabela new_contact_event
ALTER TABLE new_contact_event 
ADD COLUMN IF NOT EXISTS id_tipo_mensagem integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_name text,
ADD COLUMN IF NOT EXISTS media_type text,
ADD COLUMN IF NOT EXISTS mime_type text;