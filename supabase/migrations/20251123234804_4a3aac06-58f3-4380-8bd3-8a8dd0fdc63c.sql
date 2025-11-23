-- Remover as funções existentes
DROP FUNCTION IF EXISTS public.get_sentiment_distribution(uuid);
DROP FUNCTION IF EXISTS public.get_profile_distribution(uuid);

-- Recriar get_sentiment_distribution consultando new_contact_event (contatos) em vez de mensagens_enviadas
CREATE OR REPLACE FUNCTION public.get_sentiment_distribution(p_organization_id uuid)
RETURNS TABLE(sentiment text, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sentimento as sentiment,
    COUNT(*) as count
  FROM new_contact_event
  WHERE organization_id = p_organization_id
    AND sentimento IS NOT NULL
    AND sentimento != ''
  GROUP BY sentimento;
END;
$function$;

-- Recriar get_profile_distribution consultando new_contact_event (contatos) em vez de mensagens_enviadas
CREATE OR REPLACE FUNCTION public.get_profile_distribution(p_organization_id uuid)
RETURNS TABLE(profile text, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    perfil_contato as profile,
    COUNT(*) as count
  FROM new_contact_event
  WHERE organization_id = p_organization_id
    AND perfil_contato IS NOT NULL
    AND perfil_contato != ''
  GROUP BY perfil_contato;
END;
$function$;