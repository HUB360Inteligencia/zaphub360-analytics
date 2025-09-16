-- Adicionar colunas de mídia e mensagem na tabela campaigns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS message_text TEXT,
ADD COLUMN IF NOT EXISTS url_media TEXT,
ADD COLUMN IF NOT EXISTS name_media TEXT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;