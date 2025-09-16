-- Unificar contatos em new_contact_event, deduplicar por celular e preencher ultima_instancia
BEGIN;

-- 1) Inserir contatos faltantes da tabela contacts em new_contact_event
INSERT INTO public.new_contact_event (
  celular,
  name,
  organization_id,
  created_at,
  updated_at
)
SELECT 
  c.phone AS celular,
  c.name,
  c.organization_id,
  c.created_at,
  c.updated_at
FROM public.contacts c
WHERE c.phone IS NOT NULL
  AND c.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.new_contact_event n
    WHERE n.celular = c.phone
      AND n.organization_id = c.organization_id
  );

-- 2) Remover duplicados mantendo o registro mais recente por (organization_id, celular)
WITH ranked AS (
  SELECT 
    id_contact_event,
    organization_id,
    celular,
    ROW_NUMBER() OVER (
      PARTITION BY organization_id, celular 
      ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST, id_contact_event DESC
    ) AS rn
  FROM public.new_contact_event
  WHERE celular IS NOT NULL AND organization_id IS NOT NULL
)
DELETE FROM public.new_contact_event n
USING ranked r
WHERE n.id_contact_event = r.id_contact_event
  AND r.rn > 1;

-- 3) Preencher ultima_instancia com base na última mensagem enviada por contato
WITH last_msg AS (
  SELECT 
    organization_id,
    celular,
    instancia_id,
    ROW_NUMBER() OVER (
      PARTITION BY organization_id, celular
      ORDER BY COALESCE(data_resposta, data_leitura, data_envio) DESC NULLS LAST
    ) AS rn
  FROM public.mensagens_enviadas
  WHERE celular IS NOT NULL
    AND instancia_id IS NOT NULL
)
UPDATE public.new_contact_event n
SET ultima_instancia = l.instancia_id
FROM last_msg l
WHERE l.rn = 1
  AND n.organization_id = l.organization_id
  AND n.celular = l.celular;

COMMIT;