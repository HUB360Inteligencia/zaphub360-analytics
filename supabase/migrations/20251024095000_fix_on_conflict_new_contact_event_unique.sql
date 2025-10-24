-- Garantir que ON CONFLICT (celular, organization_id) funcione corretamente
-- 1) Deduplicar registros por (celular, organization_id), mantendo o mais recente
BEGIN;

WITH ranked AS (
  SELECT 
    id_contact_event,
    celular,
    organization_id,
    ROW_NUMBER() OVER (
      PARTITION BY celular, organization_id 
      ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST, id_contact_event DESC
    ) AS rn
  FROM public.new_contact_event
  WHERE celular IS NOT NULL AND organization_id IS NOT NULL
)
DELETE FROM public.new_contact_event n
USING ranked r
WHERE n.id_contact_event = r.id_contact_event
  AND r.rn > 1;

-- 2) Remover índice único parcial que não pode ser usado pelo ON CONFLICT
DROP INDEX IF EXISTS public.idx_new_contact_event_unique_phone_org;

-- 3) Criar constraint única canônica usada pelo ON CONFLICT
ALTER TABLE public.new_contact_event
  ADD CONSTRAINT new_contact_event_unique_org_celular UNIQUE (celular, organization_id);

COMMIT;