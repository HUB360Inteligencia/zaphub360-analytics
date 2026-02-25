-- 1. Criar função slugify robusta em PostgreSQL
CREATE OR REPLACE FUNCTION public.slugify_text(text_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text;
BEGIN
  result := lower(trim(text_input));
  
  -- Substituir caracteres portugueses
  result := translate(result, 
    'áàâãäéèêëíìîïóòôõöúùûüçñ',
    'aaaaaeeeeiiiiooooouuuucn'
  );
  
  -- Substituir caracteres não alfanuméricos por hífen
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  
  -- Remover hífens no início e fim
  result := regexp_replace(result, '^-+|-+$', '', 'g');
  
  RETURN result;
END;
$$;

-- 2. Regenerar slugs de TODOS os eventos
UPDATE public.events 
SET slug = public.slugify_text(name)
WHERE slug IS NULL OR slug LIKE '-%' OR slug = '';

-- 3. Remover filtro de status da função get_event_by_slug
CREATE OR REPLACE FUNCTION public.get_event_by_slug(event_slug text)
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
  status text
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
    e.status
  FROM public.events e
  WHERE e.slug = event_slug;
END;
$function$;

-- 4. Simplificar RLS policy de check-in
DROP POLICY IF EXISTS "Authorized users can create checkins" ON public.checkins_evento;

CREATE POLICY "Organization users can create checkins"
ON public.checkins_evento
FOR INSERT
TO public
WITH CHECK (
  organization_id = get_user_organization_id()
  AND auth.uid() IS NOT NULL
);