-- 1) Adicionar coluna para armazenar todas as instâncias selecionadas
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS instance_ids uuid[] NOT NULL DEFAULT '{}';

-- 2) Backfill inicial a partir de campanha_instancia
UPDATE public.events e
SET instance_ids = COALESCE(ci.ids, '{}')
FROM (
  SELECT
    id_campanha AS event_id,
    array_agg(id_instancia ORDER BY prioridade NULLS LAST, created_at) AS ids
  FROM public.campanha_instancia
  GROUP BY id_campanha
) ci
WHERE e.id = ci.event_id;

-- 3) Função para atualizar o array instance_ids de um evento específico
CREATE OR REPLACE FUNCTION public.refresh_event_instance_ids(target_event_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.events e
  SET instance_ids = COALESCE((
    SELECT array_agg(ci.id_instancia ORDER BY ci.prioridade NULLS LAST, ci.created_at)
    FROM public.campanha_instancia ci
    WHERE ci.id_campanha = target_event_id
  ), '{}')
  WHERE e.id = target_event_id;
END;
$$;

-- 4) Função de trigger para sincronizar após mudanças em campanha_instancia
CREATE OR REPLACE FUNCTION public.trg_sync_event_instance_ids()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.refresh_event_instance_ids(NEW.id_campanha);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_event_instance_ids(OLD.id_campanha);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5) Trigger para manter events.instance_ids sincronizado
DROP TRIGGER IF EXISTS campanha_instancia_sync_event_instance_ids ON public.campanha_instancia;
CREATE TRIGGER campanha_instancia_sync_event_instance_ids
AFTER INSERT OR UPDATE OR DELETE ON public.campanha_instancia
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_event_instance_ids();