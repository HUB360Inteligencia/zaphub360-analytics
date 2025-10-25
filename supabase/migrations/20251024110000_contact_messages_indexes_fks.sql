-- Create composite indexes to optimize typical filters and ordering
CREATE INDEX IF NOT EXISTS contact_messages_org_celular_data_mensagem_idx
  ON public.contact_messages (organization_id, celular, data_mensagem DESC);

CREATE INDEX IF NOT EXISTS contact_messages_org_inst_celular_data_mensagem_idx
  ON public.contact_messages (organization_id, instancia_id, celular, data_mensagem DESC);

-- Full-text search index for mensagem content (optional but recommended)
CREATE INDEX IF NOT EXISTS contact_messages_mensagem_gin
  ON public.contact_messages USING gin (to_tsvector('portuguese', mensagem));

-- Add foreign keys with NOT VALID then VALIDATE to minimize lock impact
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_org_fk'
  ) THEN
    ALTER TABLE public.contact_messages
      ADD CONSTRAINT contact_messages_org_fk
      FOREIGN KEY (organization_id)
      REFERENCES public.organizations(id)
      ON DELETE CASCADE
      NOT VALID;
    ALTER TABLE public.contact_messages
      VALIDATE CONSTRAINT contact_messages_org_fk;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_inst_fk'
  ) THEN
    ALTER TABLE public.contact_messages
      ADD CONSTRAINT contact_messages_inst_fk
      FOREIGN KEY (instancia_id)
      REFERENCES public.instances(id)
      ON DELETE CASCADE
      NOT VALID;
    ALTER TABLE public.contact_messages
      VALIDATE CONSTRAINT contact_messages_inst_fk;
  END IF;
END $$;