-- Criar função RPC get_hourly_activity para agregação de atividade por horário no servidor
CREATE OR REPLACE FUNCTION public.get_hourly_activity(
  p_organization_id uuid,
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  hour integer,
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
    h.hour::integer,
    COALESCE(a.messages, 0)::bigint AS messages,
    COALESCE(a.responses, 0)::bigint AS responses
  FROM generate_series(0, 23) AS h(hour)
  LEFT JOIN (
    SELECT
      EXTRACT(HOUR FROM (data_envio AT TIME ZONE 'America/Sao_Paulo'))::integer AS hour,
      COUNT(*) AS messages,
      COUNT(data_resposta) AS responses
    FROM mensagens_enviadas
    WHERE organization_id = p_organization_id
      AND data_envio IS NOT NULL
      AND (p_start_date IS NULL OR data_envio >= p_start_date)
      AND (p_end_date IS NULL OR data_envio <= p_end_date)
    GROUP BY EXTRACT(HOUR FROM (data_envio AT TIME ZONE 'America/Sao_Paulo'))
  ) a ON a.hour = h.hour
  ORDER BY h.hour ASC;
END;
$function$;
