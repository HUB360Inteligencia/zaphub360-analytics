-- Tabelas de auditoria de importação de contatos
BEGIN;

CREATE TABLE IF NOT EXISTS public.contact_import_audits (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NULL,
  source TEXT NULL,
  filename TEXT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  inserted_rows INTEGER NOT NULL DEFAULT 0,
  ignored_rows INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_import_ignored (
  id BIGSERIAL PRIMARY KEY,
  audit_id BIGINT NOT NULL REFERENCES public.contact_import_audits(id) ON DELETE CASCADE,
  celular TEXT NOT NULL,
  reason TEXT NOT NULL,
  original_row JSONB NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_contact_import_ignored_audit_id ON public.contact_import_ignored(audit_id);
CREATE INDEX IF NOT EXISTS idx_contact_import_ignored_celular ON public.contact_import_ignored(celular);

-- Habilitar RLS e políticas por organização
ALTER TABLE public.contact_import_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users manage audits in their organization"
ON public.contact_import_audits
FOR ALL
USING (organization_id = get_user_organization_id());

ALTER TABLE public.contact_import_ignored ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users view ignored linked to their audits"
ON public.contact_import_ignored
FOR ALL
USING (
  audit_id IN (
    SELECT id FROM public.contact_import_audits WHERE organization_id = get_user_organization_id()
  )
);

COMMIT;