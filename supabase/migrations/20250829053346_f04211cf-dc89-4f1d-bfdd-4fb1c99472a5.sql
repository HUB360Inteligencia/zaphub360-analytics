-- Fix security warnings by setting search_path for new functions
CREATE OR REPLACE FUNCTION public.refresh_event_instance_ids(target_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.events e
  SET instance_ids = COALESCE((
    SELECT array_agg(ci.id_instancia ORDER BY ci.prioridade NULLS LAST, ci.created_at)
    FROM public.campanha_instancia ci
    JOIN public.instances i ON i.id = ci.id_instancia
    WHERE ci.id_evento = target_event_id 
      AND i.status = 'active'
  ), '{}')
  WHERE e.id = target_event_id;
END;
$function$;

-- Fix security warnings by setting search_path for new functions
CREATE OR REPLACE FUNCTION public.handle_instance_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When instance status changes, refresh all events that use this instance
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Update all events that have this instance
    UPDATE public.events
    SET instance_ids = COALESCE((
      SELECT array_agg(ci.id_instancia ORDER BY ci.prioridade NULLS LAST, ci.created_at)
      FROM public.campanha_instancia ci
      JOIN public.instances i ON i.id = ci.id_instancia
      WHERE ci.id_evento = events.id 
        AND i.status = 'active'
    ), '{}')
    WHERE id IN (
      SELECT DISTINCT ci.id_evento
      FROM public.campanha_instancia ci
      WHERE ci.id_instancia = NEW.id AND ci.id_evento IS NOT NULL
    );
  END IF;
  
  RETURN NEW;
END;
$function$;