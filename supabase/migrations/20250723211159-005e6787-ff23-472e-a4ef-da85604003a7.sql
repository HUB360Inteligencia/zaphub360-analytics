-- Função para sincronizar contatos de new_contact_event para contacts
CREATE OR REPLACE FUNCTION public.sync_event_contacts_to_main()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir contatos de new_contact_event que não existem em contacts
  INSERT INTO public.contacts (
    name, 
    phone, 
    email, 
    organization_id, 
    origin, 
    status,
    notes,
    created_at,
    updated_at
  )
  SELECT DISTINCT
    COALESCE(NULLIF(TRIM(nce.name), ''), 'Contato ' || SUBSTRING(nce.celular, -4)) as name,
    nce.celular as phone,
    NULL as email, -- new_contact_event não tem email
    nce.organization_id,
    'evento' as origin,
    CASE 
      WHEN nce.status_envio = 'enviado' THEN 'active'
      ELSE 'active'
    END as status,
    CASE 
      WHEN nce.evento IS NOT NULL THEN 'Contato do evento: ' || nce.evento
      ELSE NULL
    END as notes,
    nce.created_at,
    COALESCE(nce.updated_at, nce.created_at) as updated_at
  FROM public.new_contact_event nce
  WHERE nce.celular IS NOT NULL 
    AND nce.organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.contacts c 
      WHERE c.phone = nce.celular 
        AND c.organization_id = nce.organization_id
    );

  -- Atualizar informações dos contatos existentes com dados mais recentes do evento
  UPDATE public.contacts 
  SET 
    name = CASE 
      WHEN COALESCE(NULLIF(TRIM(contacts.name), ''), '') = '' OR contacts.name LIKE 'Contato %'
      THEN COALESCE(NULLIF(TRIM(nce.name), ''), contacts.name)
      ELSE contacts.name
    END,
    notes = CASE 
      WHEN nce.evento IS NOT NULL AND (contacts.notes IS NULL OR contacts.notes NOT LIKE '%evento:%')
      THEN COALESCE(contacts.notes || '; ', '') || 'Evento: ' || nce.evento
      ELSE contacts.notes
    END,
    updated_at = GREATEST(contacts.updated_at, COALESCE(nce.updated_at, nce.created_at))
  FROM public.new_contact_event nce
  WHERE contacts.phone = nce.celular 
    AND contacts.organization_id = nce.organization_id
    AND nce.celular IS NOT NULL
    AND nce.organization_id IS NOT NULL;

END;
$$;

-- Trigger para sincronizar automaticamente quando novos contatos são inseridos em new_contact_event
CREATE OR REPLACE FUNCTION public.trigger_sync_event_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se é um novo contato válido
  IF NEW.celular IS NOT NULL AND NEW.organization_id IS NOT NULL THEN
    -- Inserir na tabela contacts se não existir
    INSERT INTO public.contacts (
      name, 
      phone, 
      email, 
      organization_id, 
      origin, 
      status,
      notes,
      created_at,
      updated_at
    )
    SELECT 
      COALESCE(NULLIF(TRIM(NEW.name), ''), 'Contato ' || SUBSTRING(NEW.celular, -4)) as name,
      NEW.celular as phone,
      NULL as email,
      NEW.organization_id,
      'evento' as origin,
      'active' as status,
      CASE 
        WHEN NEW.evento IS NOT NULL THEN 'Contato do evento: ' || NEW.evento
        ELSE NULL
      END as notes,
      NEW.created_at,
      COALESCE(NEW.updated_at, NEW.created_at) as updated_at
    WHERE NOT EXISTS (
      SELECT 1 FROM public.contacts c 
      WHERE c.phone = NEW.celular 
        AND c.organization_id = NEW.organization_id
    );
    
    -- Atualizar contato existente se necessário
    UPDATE public.contacts 
    SET 
      name = CASE 
        WHEN COALESCE(NULLIF(TRIM(contacts.name), ''), '') = '' OR contacts.name LIKE 'Contato %'
        THEN COALESCE(NULLIF(TRIM(NEW.name), ''), contacts.name)
        ELSE contacts.name
      END,
      notes = CASE 
        WHEN NEW.evento IS NOT NULL AND (contacts.notes IS NULL OR contacts.notes NOT LIKE '%evento:%')
        THEN COALESCE(contacts.notes || '; ', '') || 'Evento: ' || NEW.evento
        ELSE contacts.notes
      END,
      updated_at = GREATEST(contacts.updated_at, COALESCE(NEW.updated_at, NEW.created_at))
    WHERE contacts.phone = NEW.celular 
      AND contacts.organization_id = NEW.organization_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS sync_event_contact_trigger ON public.new_contact_event;
CREATE TRIGGER sync_event_contact_trigger
  AFTER INSERT OR UPDATE ON public.new_contact_event
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_event_contact();

-- Executar sincronização inicial para contatos existentes
SELECT public.sync_event_contacts_to_main();