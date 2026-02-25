-- Create event_checkin_permissions table
CREATE TABLE public.event_checkin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT event_checkin_permissions_unique UNIQUE (event_id, user_id)
);

CREATE INDEX idx_event_checkin_permissions_event_id ON public.event_checkin_permissions(event_id);
CREATE INDEX idx_event_checkin_permissions_user_id ON public.event_checkin_permissions(user_id);
CREATE INDEX idx_event_checkin_permissions_organization_id ON public.event_checkin_permissions(organization_id);

-- Create checkins_evento table
CREATE TABLE public.checkins_evento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  
  -- Form data
  nome text NOT NULL,
  celular text NOT NULL,
  bairro text,
  cidade text,
  cargo text,
  data_aniversario_text text,
  
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  checked_in_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkins_evento_event_id ON public.checkins_evento(event_id);
CREATE INDEX idx_checkins_evento_contact_id ON public.checkins_evento(contact_id);
CREATE INDEX idx_checkins_evento_organization_id ON public.checkins_evento(organization_id);
CREATE INDEX idx_checkins_evento_created_at ON public.checkins_evento(created_at DESC);

-- Create mensagens_checkin_eventos table (queue)
CREATE TABLE public.mensagens_checkin_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  tipo_fluxo text NOT NULL DEFAULT 'evento',
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  checkin_id uuid NOT NULL REFERENCES public.checkins_evento(id) ON DELETE CASCADE,
  celular text NOT NULL,
  
  -- Message content
  template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL,
  mensagem text,
  
  -- Media
  url_midia text,
  tipo_midia text,
  nome_midia text,
  caption text,
  
  -- Sending control
  instancia_id uuid REFERENCES public.instances(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'fila',
  delay_mensagem numeric,
  data_envio timestamptz,
  error_message text,
  
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mensagens_checkin_event_id ON public.mensagens_checkin_eventos(event_id);
CREATE INDEX idx_mensagens_checkin_status ON public.mensagens_checkin_eventos(status);
CREATE INDEX idx_mensagens_checkin_organization_id ON public.mensagens_checkin_eventos(organization_id);
CREATE INDEX idx_mensagens_checkin_created_at ON public.mensagens_checkin_eventos(created_at DESC);

-- RLS Policies for event_checkin_permissions
ALTER TABLE public.event_checkin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permissions from their organization"
  ON public.event_checkin_permissions FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and clients can manage permissions"
  ON public.event_checkin_permissions FOR ALL
  USING (
    organization_id = get_user_organization_id() 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('saas_admin', 'client', 'manager')
    )
  );

-- RLS Policies for checkins_evento
ALTER TABLE public.checkins_evento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checkins from their organization"
  ON public.checkins_evento FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Authorized users can create checkins"
  ON public.checkins_evento FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND (
      -- User has explicit permission for this event
      EXISTS (
        SELECT 1 FROM event_checkin_permissions
        WHERE event_id = checkins_evento.event_id
        AND user_id = auth.uid()
      )
      OR
      -- User is admin/client/manager
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('saas_admin', 'client', 'manager')
      )
    )
  );

-- RLS Policies for mensagens_checkin_eventos
ALTER TABLE public.mensagens_checkin_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checkin messages from their organization"
  ON public.mensagens_checkin_eventos FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Authorized users can manage checkin messages"
  ON public.mensagens_checkin_eventos FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND (
      EXISTS (
        SELECT 1 FROM event_checkin_permissions
        WHERE event_id = mensagens_checkin_eventos.event_id
        AND user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('saas_admin', 'client', 'manager')
      )
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_mensagens_checkin_updated_at
  BEFORE UPDATE ON public.mensagens_checkin_eventos
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();