-- Migração: auditoria e RPC para pausar/retomar mensagens de campanha
-- Cria tabela de auditoria e duas funções RPC atômicas para pause/resume

-- Tabela de auditoria de transições de status de mensagens
CREATE TABLE IF NOT EXISTS public.campaign_message_audits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  campaign_id uuid,
  message_id uuid,
  operation text NOT NULL, -- 'pause' | 'resume'
  previous_status text,
  new_status text,
  performed_by uuid,
  performed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_campaign_message_audits_batch ON public.campaign_message_audits (batch_id);
CREATE INDEX IF NOT EXISTS idx_campaign_message_audits_message ON public.campaign_message_audits (message_id);

-- Função RPC para pausar mensagens (status -> 'fila')
CREATE OR REPLACE FUNCTION public.rpc_pause_campaign_messages(
  org_id uuid,
  campaign_id uuid,
  performed_by uuid DEFAULT NULL
)
RETURNS TABLE(batch_id uuid, message_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b_id uuid := gen_random_uuid();
  r record;
BEGIN
  -- Atualiza status das mensagens elegíveis e insere audit log para cada uma
  FOR r IN
    UPDATE public.mensagens_enviadas
    SET status = 'fila'
    WHERE organization_id = org_id
      AND id_campanha = campaign_id
      AND status IN ('pendente', 'processando')
    RETURNING id, status AS previous_status
  LOOP
    INSERT INTO public.campaign_message_audits (
      batch_id, organization_id, campaign_id, message_id,
      operation, previous_status, new_status, performed_by
    ) VALUES (
      b_id, org_id, campaign_id, r.id,
      'pause', r.previous_status, 'fila', performed_by
    );

    RETURN NEXT b_id, r.id;
  END LOOP;

  RETURN;
EXCEPTION WHEN others THEN
  -- Em caso de erro, propagar com mensagem clara
  RAISE;
END;
$$;

-- Função RPC para retomar mensagens (apenas as alteradas no batch)
CREATE OR REPLACE FUNCTION public.rpc_resume_campaign_messages(
  org_id uuid,
  campaign_id uuid,
  target_batch_id uuid,
  performed_by uuid DEFAULT NULL
)
RETURNS TABLE(message_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  -- Retorna apenas mensagens que estão atualmente em 'fila' e que pertencem ao batch
  FOR r IN
    UPDATE public.mensagens_enviadas
    SET status = 'pendente'
    WHERE organization_id = org_id
      AND id_campanha = campaign_id
      AND status = 'fila'
      AND id IN (
        SELECT message_id FROM public.campaign_message_audits
        WHERE batch_id = target_batch_id
      )
    RETURNING id, status AS previous_status
  LOOP
    INSERT INTO public.campaign_message_audits (
      batch_id, organization_id, campaign_id, message_id,
      operation, previous_status, new_status, performed_by
    ) VALUES (
      target_batch_id, org_id, campaign_id, r.id,
      'resume', r.previous_status, 'pendente', performed_by
    );

    RETURN NEXT r.id;
  END LOOP;

  RETURN;
EXCEPTION WHEN others THEN
  RAISE;
END;
$$;

-- Garantir execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.rpc_pause_campaign_messages(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_resume_campaign_messages(uuid, uuid, uuid, uuid) TO authenticated;

-- Fim da migração