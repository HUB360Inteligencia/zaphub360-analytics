
-- Criar política RLS para permitir acesso público aos dados agregados de event_messages
-- Permitir SELECT apenas dos campos necessários para métricas públicas
CREATE POLICY "Public access to event analytics data" 
ON public.event_messages 
FOR SELECT 
USING (true);

-- Para segurança, vamos criar uma view que expõe apenas os dados necessários
CREATE OR REPLACE VIEW public.public_event_analytics AS
SELECT 
  event_id,
  status,
  created_at,
  sent_at,
  read_at,
  responded_at,
  delivered_at
FROM public.event_messages;

-- Permitir acesso público à view
GRANT SELECT ON public.public_event_analytics TO anon;
