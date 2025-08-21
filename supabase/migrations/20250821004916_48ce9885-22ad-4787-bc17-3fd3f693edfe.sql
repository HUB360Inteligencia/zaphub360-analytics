
-- 1) Backfill: copie id_evento para id_campanha quando id_campanha estiver NULL
UPDATE public.campanha_instancia
SET id_campanha = id_evento
WHERE id_evento IS NOT NULL
  AND id_campanha IS NULL;

-- 2) Atualize as RLS policies para usarem apenas id_campanha como "dono" (campanha OU evento)
DROP POLICY IF EXISTS "Users can manage instances in their organization" ON public.campanha_instancia;
DROP POLICY IF EXISTS "Users can view instances from their organization" ON public.campanha_instancia;

CREATE POLICY "Users can manage instances in their organization"
  ON public.campanha_instancia
  FOR ALL
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.campaigns c
        WHERE c.id = campanha_instancia.id_campanha
          AND c.organization_id = get_user_organization_id()
      )
    ) OR (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = campanha_instancia.id_campanha
          AND e.organization_id = get_user_organization_id()
      )
    )
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.campaigns c
        WHERE c.id = campanha_instancia.id_campanha
          AND c.organization_id = get_user_organization_id()
      )
    ) OR (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = campanha_instancia.id_campanha
          AND e.organization_id = get_user_organization_id()
      )
    )
  );

CREATE POLICY "Users can view instances from their organization"
  ON public.campanha_instancia
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.campaigns c
        WHERE c.id = campanha_instancia.id_campanha
          AND c.organization_id = get_user_organization_id()
      )
    ) OR (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = campanha_instancia.id_campanha
          AND e.organization_id = get_user_organization_id()
      )
    )
  );

-- 3) Remova a coluna id_evento (FKs/índices dependentes serão removidos juntos)
ALTER TABLE public.campanha_instancia
  DROP COLUMN IF EXISTS id_evento;

-- 4) Garanta unicidade do par (id_campanha, id_instancia) para suportar upsert e evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS campanha_instancia_unique_parent_instance
  ON public.campanha_instancia (id_campanha, id_instancia);
