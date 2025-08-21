
-- 1) Backfill: mover id_evento -> id_campanha quando id_campanha estiver nulo
UPDATE public.campanha_instancia
SET id_campanha = id_evento
WHERE id_campanha IS NULL
  AND id_evento IS NOT NULL;

-- 2) Garantir que a RLS esteja habilitada
ALTER TABLE public.campanha_instancia ENABLE ROW LEVEL SECURITY;

-- 3) Remover políticas antigas que exigiam id_evento para eventos
DROP POLICY IF EXISTS "Users can manage instances in their organization" ON public.campanha_instancia;
DROP POLICY IF EXISTS "Users can view instances from their organization" ON public.campanha_instancia;

-- 4) Criar políticas unificadas usando apenas id_campanha,
-- validando pertencimento à organização para campaigns OU events
CREATE POLICY "Users can manage instances in their organization"
ON public.campanha_instancia
FOR ALL
USING (
  id_campanha IS NOT NULL AND (
    EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = campanha_instancia.id_campanha
        AND c.organization_id = get_user_organization_id()
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = campanha_instancia.id_campanha
        AND e.organization_id = get_user_organization_id()
    )
  )
)
WITH CHECK (
  id_campanha IS NOT NULL AND (
    EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = campanha_instancia.id_campanha
        AND c.organization_id = get_user_organization_id()
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = campanha_instancia.id_campanha
        AND e.organization_id = get_user_organization_id()
    )
  )
);

CREATE POLICY "Users can view instances from their organization"
ON public.campanha_instancia
FOR SELECT
USING (
  id_campanha IS NOT NULL AND (
    EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = campanha_instancia.id_campanha
        AND c.organization_id = get_user_organization_id()
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = campanha_instancia.id_campanha
        AND e.organization_id = get_user_organization_id()
    )
  )
);

-- 5) Evitar duplicidade de vínculos para um mesmo alvo e instância
CREATE UNIQUE INDEX IF NOT EXISTS unique_campanha_instancia
ON public.campanha_instancia (id_campanha, id_instancia);

-- 6) (Opcional, recomendado) Remover a coluna antiga para padronização
ALTER TABLE public.campanha_instancia
DROP COLUMN IF EXISTS id_evento;
