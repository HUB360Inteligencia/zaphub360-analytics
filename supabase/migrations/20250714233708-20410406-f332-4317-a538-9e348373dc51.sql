
-- Adicionar coluna sentiment na tabela event_messages
ALTER TABLE public.event_messages 
ADD COLUMN sentiment TEXT CHECK (sentiment IN ('super_engajado', 'positivo', 'neutro', 'negativo'));

-- Criar função para mapear sentimentos existentes
CREATE OR REPLACE FUNCTION map_existing_sentiments()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mapear sentimentos da tabela new_contact_event para event_messages
  -- baseado no telefone do contato
  UPDATE event_messages 
  SET sentiment = CASE 
    WHEN nce.sentimento ILIKE '%desinteressado%' THEN 'negativo'
    WHEN nce.sentimento ILIKE '%positivo%' THEN 'positivo'
    WHEN nce.sentimento ILIKE '%engajado%' THEN 'super_engajado'
    WHEN nce.sentimento ILIKE '%neutro%' THEN 'neutro'
    ELSE 'neutro'
  END
  FROM new_contact_event nce
  WHERE event_messages.contact_phone = nce.celular
  AND nce.sentimento IS NOT NULL
  AND event_messages.sentiment IS NULL;
END;
$$;

-- Executar a função para mapear dados existentes
SELECT map_existing_sentiments();

-- Criar trigger para sincronizar sentimentos entre tabelas
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
      ELSE 'Neutro'
    END,
    updated_at = now()
    WHERE celular = NEW.contact_phone;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar o trigger
DROP TRIGGER IF EXISTS sentiment_sync_trigger ON event_messages;
CREATE TRIGGER sentiment_sync_trigger
  AFTER UPDATE ON event_messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_sentiment_trigger();
