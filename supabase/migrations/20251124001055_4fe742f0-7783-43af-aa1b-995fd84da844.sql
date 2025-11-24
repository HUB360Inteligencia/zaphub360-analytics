-- 1. Adicionar constraint único na tabela contacts para permitir upsert
ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_org_phone_unique UNIQUE (organization_id, phone);

-- 2. Adicionar campo slug na tabela events
ALTER TABLE public.events 
ADD COLUMN slug text;

-- 3. Gerar slugs para eventos existentes
UPDATE public.events 
SET slug = lower(regexp_replace(
  regexp_replace(name, '[áàâãä]', 'a', 'gi'),
  '[^a-z0-9]+', '-', 'g'
))
WHERE slug IS NULL;

-- 4. Tornar slug único e obrigatório
ALTER TABLE public.events 
ADD CONSTRAINT events_slug_unique UNIQUE (slug);

ALTER TABLE public.events 
ALTER COLUMN slug SET NOT NULL;

-- 5. Criar função RPC para buscar evento por slug (acesso público)
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
  WHERE e.slug = event_slug
    AND e.status = 'active';
END;
$function$;