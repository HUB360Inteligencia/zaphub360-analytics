-- Função para obter distribuição de sentimentos agregada no servidor
CREATE OR REPLACE FUNCTION public.get_sentiment_distribution(p_organization_id UUID)
RETURNS TABLE(
  sentiment TEXT,
  count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sentimento as sentiment,
    COUNT(*) as count
  FROM mensagens_enviadas
  WHERE organization_id = p_organization_id
    AND sentimento IS NOT NULL
    AND sentimento != ''
  GROUP BY sentimento;
END;
$$;

-- Função para obter distribuição de perfis agregada no servidor
CREATE OR REPLACE FUNCTION public.get_profile_distribution(p_organization_id UUID)
RETURNS TABLE(
  profile TEXT,
  count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    perfil_contato as profile,
    COUNT(*) as count
  FROM mensagens_enviadas
  WHERE organization_id = p_organization_id
    AND perfil_contato IS NOT NULL
    AND perfil_contato != ''
  GROUP BY perfil_contato;
END;
$$;