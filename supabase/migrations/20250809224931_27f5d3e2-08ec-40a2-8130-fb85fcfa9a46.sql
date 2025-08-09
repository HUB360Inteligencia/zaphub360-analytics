-- Primeiro, adicionar campos necessários para campanhas na tabela mensagens_enviadas
ALTER TABLE public.mensagens_enviadas 
ADD COLUMN IF NOT EXISTS tentativas_envio INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS erro_envio TEXT;

-- Adicionar coluna id_campanha para ligar mensagens às campanhas
ALTER TABLE public.mensagens_enviadas 
ADD COLUMN IF NOT EXISTS id_campanha UUID;

-- Garantir que tipo_fluxo aceite os valores necessários
-- Verificar se já existem valores 'campanha' e 'evento'
UPDATE public.mensagens_enviadas 
SET tipo_fluxo = COALESCE(tipo_fluxo, 'evento')
WHERE tipo_fluxo IS NULL;

-- Criar políticas RLS para mensagens_enviadas
ALTER TABLE public.mensagens_enviadas ENABLE ROW LEVEL SECURITY;

-- Política para campanhas - usuários podem ver mensagens de campanhas da sua organização
CREATE POLICY "Users can view campaign messages from their organization" 
ON public.mensagens_enviadas 
FOR SELECT 
USING (
  tipo_fluxo = 'campanha' 
  AND EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = mensagens_enviadas.id_campanha 
    AND c.organization_id = get_user_organization_id()
  )
);

-- Política para eventos - usuários podem ver mensagens de eventos da sua organização  
CREATE POLICY "Users can view event messages from their organization"
ON public.mensagens_enviadas
FOR SELECT
USING (
  tipo_fluxo = 'evento'
  AND EXISTS (
    SELECT 1 FROM instances i 
    WHERE i.id = mensagens_enviadas.instancia_id 
    AND i.organization_id = get_user_organization_id()
  )
);

-- Políticas para inserção de mensagens de campanhas
CREATE POLICY "Users can insert campaign messages in their organization"
ON public.mensagens_enviadas
FOR INSERT
WITH CHECK (
  tipo_fluxo = 'campanha'
  AND EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = mensagens_enviadas.id_campanha 
    AND c.organization_id = get_user_organization_id()
  )
);

-- Políticas para atualização de mensagens de campanhas
CREATE POLICY "Users can update campaign messages in their organization"
ON public.mensagens_enviadas
FOR UPDATE
USING (
  tipo_fluxo = 'campanha'
  AND EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = mensagens_enviadas.id_campanha 
    AND c.organization_id = get_user_organization_id()
  )
);

-- Atualizar função de métricas para usar mensagens_enviadas
CREATE OR REPLACE FUNCTION public.update_campaign_metrics()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Atualizar métricas da campanha quando mensagens mudam de status
  UPDATE campaigns 
  SET 
    total_mensagens = (
      SELECT COUNT(*) FROM mensagens_enviadas 
      WHERE id_campanha = COALESCE(NEW.id_campanha, OLD.id_campanha)
      AND tipo_fluxo = 'campanha'
    ),
    mensagens_enviadas = (
      SELECT COUNT(*) FROM mensagens_enviadas 
      WHERE id_campanha = COALESCE(NEW.id_campanha, OLD.id_campanha) 
      AND tipo_fluxo = 'campanha'
      AND status = 'enviado'
    ),
    mensagens_lidas = (
      SELECT COUNT(*) FROM mensagens_enviadas 
      WHERE id_campanha = COALESCE(NEW.id_campanha, OLD.id_campanha) 
      AND tipo_fluxo = 'campanha'
      AND data_leitura IS NOT NULL
    ),
    mensagens_respondidas = (
      SELECT COUNT(*) FROM mensagens_enviadas 
      WHERE id_campanha = COALESCE(NEW.id_campanha, OLD.id_campanha) 
      AND tipo_fluxo = 'campanha'
      AND data_resposta IS NOT NULL
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.id_campanha, OLD.id_campanha);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Criar trigger para atualizar métricas de campanhas
DROP TRIGGER IF EXISTS update_campaign_metrics_trigger ON mensagens_enviadas;
CREATE TRIGGER update_campaign_metrics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON mensagens_enviadas
  FOR EACH ROW
  WHEN (NEW.tipo_fluxo = 'campanha' OR OLD.tipo_fluxo = 'campanha')
  EXECUTE FUNCTION update_campaign_metrics();