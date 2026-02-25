-- Adicionar campos de controle de cargos na tabela events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS allowed_positions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS restrict_positions BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.events.allowed_positions IS 
  'Lista de cargos pré-definidos para o evento. Ex: ["Vereador", "Prefeito", "Secretário"]';

COMMENT ON COLUMN public.events.restrict_positions IS 
  'Se true, apenas permite cargos da lista allowed_positions. Se false, permite criar novos.';

-- Criar função de validação para cargos em check-ins
CREATE OR REPLACE FUNCTION validate_checkin_position()
RETURNS TRIGGER AS $$
DECLARE
  event_config RECORD;
BEGIN
  -- Buscar configuração do evento
  SELECT allowed_positions, restrict_positions
  INTO event_config
  FROM events
  WHERE id = NEW.event_id;
  
  -- Se modo restrito ativo, validar
  IF event_config.restrict_positions AND event_config.allowed_positions IS NOT NULL THEN
    IF NOT (NEW.cargo = ANY(
      SELECT jsonb_array_elements_text(event_config.allowed_positions)
    )) THEN
      RAISE EXCEPTION 'Cargo "%" não está na lista permitida para este evento', NEW.cargo;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar cargos antes de inserir check-ins
DROP TRIGGER IF EXISTS validate_checkin_position_trigger ON public.checkins_evento;
CREATE TRIGGER validate_checkin_position_trigger
BEFORE INSERT ON public.checkins_evento
FOR EACH ROW
EXECUTE FUNCTION validate_checkin_position();