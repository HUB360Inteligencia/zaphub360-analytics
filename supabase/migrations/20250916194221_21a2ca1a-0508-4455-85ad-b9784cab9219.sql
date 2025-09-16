-- Function to update ultima_instancia based on the most recent message
CREATE OR REPLACE FUNCTION public.update_contact_ultima_instancia()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update ultima_instancia for all contacts based on their most recent message
  UPDATE public.new_contact_event 
  SET ultima_instancia = subquery.instancia_id,
      updated_at = now()
  FROM (
    SELECT DISTINCT ON (me.celular) 
      me.celular,
      me.instancia_id
    FROM public.mensagens_enviadas me
    WHERE me.instancia_id IS NOT NULL
      AND me.celular IS NOT NULL
    ORDER BY me.celular, COALESCE(me.data_envio, '1900-01-01'::timestamp with time zone) DESC
  ) as subquery
  WHERE new_contact_event.celular = subquery.celular;
END;
$$;

-- Trigger function to automatically update ultima_instancia when new messages are sent
CREATE OR REPLACE FUNCTION public.trigger_update_ultima_instancia()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the contact's ultima_instancia when a new message is inserted
  IF NEW.celular IS NOT NULL AND NEW.instancia_id IS NOT NULL THEN
    UPDATE public.new_contact_event 
    SET ultima_instancia = NEW.instancia_id,
        updated_at = now()
    WHERE celular = NEW.celular;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on mensagens_enviadas
CREATE TRIGGER trg_update_ultima_instancia
  AFTER INSERT ON public.mensagens_enviadas
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_ultima_instancia();

-- Function for manual synchronization
CREATE OR REPLACE FUNCTION public.sync_ultima_instancia_manual()
RETURNS TABLE(updated_contacts bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count bigint;
BEGIN
  -- Call the update function
  PERFORM public.update_contact_ultima_instancia();
  
  -- Count how many contacts were updated
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN QUERY SELECT updated_count;
END;
$$;

-- Execute initial update for existing data
SELECT public.update_contact_ultima_instancia();