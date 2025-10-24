-- Ajustar RLS das tabelas de auditoria para permitir INSERT
BEGIN;

-- contact_import_audits: adicionar WITH CHECK por organização
DROP POLICY IF EXISTS "Users manage audits in their organization" ON public.contact_import_audits;
CREATE POLICY "Users manage audits in their organization"
ON public.contact_import_audits
FOR ALL
USING (organization_id = get_user_organization_id())
WITH CHECK (organization_id = get_user_organization_id());

-- contact_import_ignored: garantir WITH CHECK amarrado ao audit da mesma organização
DROP POLICY IF EXISTS "Users view ignored linked to their audits" ON public.contact_import_ignored;
CREATE POLICY "Users manage ignored linked to their audits"
ON public.contact_import_ignored
FOR ALL
USING (
  audit_id IN (
    SELECT id FROM public.contact_import_audits WHERE organization_id = get_user_organization_id()
  )
)
WITH CHECK (
  audit_id IN (
    SELECT id FROM public.contact_import_audits WHERE organization_id = get_user_organization_id()
  )
);

COMMIT;