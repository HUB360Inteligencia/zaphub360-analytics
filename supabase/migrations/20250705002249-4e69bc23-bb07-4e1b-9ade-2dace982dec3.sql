-- Adicionar campos necessários à tabela new_contact_event
ALTER TABLE public.new_contact_event 
ADD COLUMN organization_id uuid,
ADD COLUMN status_envio text DEFAULT 'pendente',
ADD COLUMN event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Atualizar registros existentes para ter organization_id baseado no evento
UPDATE public.new_contact_event 
SET organization_id = (
  SELECT e.organization_id 
  FROM public.events e 
  WHERE e.event_id = new_contact_event.evento
  LIMIT 1
)
WHERE evento IS NOT NULL;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_new_contact_event_updated_at
  BEFORE UPDATE ON public.new_contact_event
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

-- Habilitar RLS
ALTER TABLE public.new_contact_event ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can manage event contacts in their organization" 
ON public.new_contact_event 
FOR ALL 
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can view event contacts from their organization" 
ON public.new_contact_event 
FOR SELECT 
USING (organization_id = get_user_organization_id());