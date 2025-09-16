-- Add id_tipo_mensagem field to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS id_tipo_mensagem integer DEFAULT 1;