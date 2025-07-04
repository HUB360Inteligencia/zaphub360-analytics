-- Criar tabela de instâncias WhatsApp
CREATE TABLE public.instances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone_number text NOT NULL,
  api_key text,
  api_url text,
  status text NOT NULL DEFAULT 'inactive',
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela instances
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;

-- Criar políticas para instances
CREATE POLICY "Users can manage instances in their organization" 
ON public.instances 
FOR ALL 
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can view instances from their organization" 
ON public.instances 
FOR SELECT 
USING (organization_id = get_user_organization_id());

-- Criar tabela de eventos
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  event_id text NOT NULL, -- ID customizável pelo usuário
  location text,
  event_date timestamp with time zone,
  instance_id uuid REFERENCES public.instances(id),
  message_text text NOT NULL,
  message_image text, -- URL da imagem
  image_filename text, -- Nome do arquivo da imagem
  organization_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Criar políticas para events
CREATE POLICY "Users can manage events in their organization" 
ON public.events 
FOR ALL 
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can view events from their organization" 
ON public.events 
FOR SELECT 
USING (organization_id = get_user_organization_id());

-- Criar tabela de mensagens de eventos (para relatórios)
CREATE TABLE public.event_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  contact_phone text NOT NULL,
  contact_name text,
  message_content text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  read_at timestamp with time zone,
  responded_at timestamp with time zone,
  error_message text,
  retry_count integer DEFAULT 0,
  organization_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela event_messages
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- Criar políticas para event_messages
CREATE POLICY "Users can manage event_messages in their organization" 
ON public.event_messages 
FOR ALL 
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can view event_messages from their organization" 
ON public.event_messages 
FOR SELECT 
USING (organization_id = get_user_organization_id());

-- Criar bucket de storage para imagens de eventos
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);

-- Criar políticas para o bucket de imagens de eventos
CREATE POLICY "Users can view event images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-images');

CREATE POLICY "Users can upload event images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their event images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'event-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their event images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'event-images' AND auth.uid() IS NOT NULL);

-- Criar trigger para atualizar updated_at nas tabelas
CREATE TRIGGER update_instances_updated_at
  BEFORE UPDATE ON public.instances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();