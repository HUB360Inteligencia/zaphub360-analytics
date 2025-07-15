
-- ETAPA 1: Modificações no Banco de Dados

-- 1. Remover a constraint atual de sentiment para permitir NULL
ALTER TABLE public.event_messages 
DROP CONSTRAINT IF EXISTS event_messages_sentiment_check;

-- 2. Adicionar nova constraint que permite NULL
ALTER TABLE public.event_messages 
ADD CONSTRAINT event_messages_sentiment_check 
CHECK (sentiment IS NULL OR sentiment IN ('super_engajado', 'positivo', 'neutro', 'negativo'));

-- 3. Converter todos os registros "negativo" para NULL
UPDATE public.event_messages 
SET sentiment = NULL 
WHERE sentiment = 'negativo';

-- 4. Adicionar coluna avatar_url na tabela contacts para foto
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 5. Atualizar a função de sincronização para lidar com valores NULL
CREATE OR REPLACE FUNCTION sync_sentiment_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Quando sentiment é atualizado em event_messages, atualizar new_contact_event
  IF TG_OP = 'UPDATE' AND OLD.sentiment IS DISTINCT FROM NEW.sentiment THEN
    UPDATE new_contact_event 
    SET sentimento = CASE NEW.sentiment
      WHEN 'super_engajado' THEN 'Super Engajado'
      WHEN 'positivo' THEN 'Positivo'
      WHEN 'neutro' THEN 'Neutro'
      WHEN 'negativo' THEN 'Negativo'
      ELSE NULL  -- Para valores NULL
    END,
    updated_at = now()
    WHERE celular = NEW.contact_phone;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Verificar resultados
SELECT 
  COALESCE(sentiment, 'NULL') as sentiment_status,
  COUNT(*) as total
FROM event_messages 
GROUP BY sentiment 
ORDER BY sentiment_status;
