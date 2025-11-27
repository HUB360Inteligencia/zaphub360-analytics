-- Drop and recreate get_event_by_slug function with additional fields
DROP FUNCTION IF EXISTS public.get_event_by_slug(text);

CREATE FUNCTION public.get_event_by_slug(event_slug text)
RETURNS TABLE(
  id uuid, 
  event_id text, 
  name text, 
  event_date timestamp with time zone, 
  location text, 
  message_text text, 
  message_image text, 
  media_type text, 
  organization_id uuid, 
  status text,
  tempo_min numeric,
  tempo_max numeric,
  image_filename text,
  mime_type text,
  id_tipo_mensagem numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.event_id,
    e.name,
    e.event_date,
    e.location,
    e.message_text,
    e.message_image,
    e.media_type,
    e.organization_id,
    e.status,
    e.tempo_min,
    e.tempo_max,
    e.image_filename,
    e.mime_type,
    e.id_tipo_mensagem
  FROM public.events e
  WHERE e.slug = event_slug;
END;
$function$;