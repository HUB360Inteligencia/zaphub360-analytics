
-- 1) Recalcular instance_ids de eventos considerando apenas instâncias ativas
CREATE OR REPLACE FUNCTION public.refresh_event_instance_ids(target_event_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.events e
  SET instance_ids = COALESCE((
    SELECT array_agg(ci.id_instancia ORDER BY ci.prioridade NULLS LAST, ci.created_at)
    FROM public.campanha_instancia ci
    JOIN public.instances i ON i.id = ci.id_instancia
    WHERE (ci.id_evento = target_event_id OR ci.id_campanha = target_event_id)
      AND i.status = 'active'
  ), '{}')
  WHERE e.id = target_event_id;
END;
$function$;

-- 2) Sincronizar events.instance_ids quando campanha_instancia mudar
DROP TRIGGER IF EXISTS trg_campanha_instancia_sync ON public.campanha_instancia;

CREATE TRIGGER trg_campanha_instancia_sync
AFTER INSERT OR UPDATE OR DELETE ON public.campanha_instancia
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_event_instance_ids();

-- 3) Recalcular instance_ids de eventos quando o status de uma instância mudar
CREATE OR REPLACE FUNCTION public.handle_instance_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  rec RECORD;
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Para cada evento/campanha linkado à instância, atualizar o array instance_ids
    FOR rec IN
      SELECT DISTINCT COALESCE(ci.id_evento, ci.id_campanha) AS event_id
      FROM public.campanha_instancia ci
      WHERE ci.id_instancia = NEW.id
        AND (ci.id_evento IS NOT NULL OR ci.id_campanha IS NOT NULL)
    LOOP
      PERFORM public.refresh_event_instance_ids(rec.event_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_instance_status_change ON public.instances;

CREATE TRIGGER trg_instance_status_change
AFTER UPDATE OF status ON public.instances
FOR EACH ROW EXECUTE FUNCTION public.handle_instance_status_change();

-- 4) Recalcular todos os eventos existentes uma vez
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.events LOOP
    PERFORM public.refresh_event_instance_ids(r.id);
  END LOOP;
END $$;
