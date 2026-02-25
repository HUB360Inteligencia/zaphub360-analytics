-- Criar função RPC get_daily_activity para agregação de atividade diária no servidor
CREATE OR REPLACE FUNCTION public.get_daily_activity(
  p_organization_id uuid,
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  activity_date date,
  messages bigint,
  responses bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(data_envio AT TIME ZONE 'America/Sao_Paulo') as activity_date,
    COUNT(*) as messages,
    COUNT(data_resposta) as responses
  FROM mensagens_enviadas
  WHERE organization_id = p_organization_id
    AND data_envio IS NOT NULL
    -- Aplica filtro de data apenas se fornecido
    AND (p_start_date IS NULL OR data_envio >= p_start_date)
    AND (p_end_date IS NULL OR data_envio <= p_end_date)
  GROUP BY DATE(data_envio AT TIME ZONE 'America/Sao_Paulo')
  ORDER BY activity_date ASC;
END;
$function$;