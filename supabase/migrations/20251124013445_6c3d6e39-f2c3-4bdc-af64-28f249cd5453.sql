-- PARTE 1: Criar tabela user_roles usando enum existente
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Index para melhorar performance de consultas
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_organization_id ON public.user_roles(organization_id);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- PARTE 2: Criar função SECURITY DEFINER para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função auxiliar para obter role do usuário em uma organização
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID, _organization_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id 
    AND (organization_id = _organization_id OR organization_id IS NULL)
  LIMIT 1
$$;

-- Função para obter role global do usuário (para saas_admin)
CREATE OR REPLACE FUNCTION public.get_user_global_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'saas_admin'::user_role THEN 1
      WHEN 'client'::user_role THEN 2
      WHEN 'manager'::user_role THEN 3
      WHEN 'agent'::user_role THEN 4
      WHEN 'viewer'::user_role THEN 5
      WHEN 'guest'::user_role THEN 6
    END
  LIMIT 1
$$;

-- PARTE 3: Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "SaaS admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'saas_admin'::user_role));

CREATE POLICY "SaaS admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'saas_admin'::user_role))
  WITH CHECK (public.has_role(auth.uid(), 'saas_admin'::user_role));

-- PARTE 4: Migrar dados existentes de profiles para user_roles
INSERT INTO public.user_roles (user_id, organization_id, role)
SELECT 
  id, 
  organization_id, 
  role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- PARTE 5: Trigger para manter user_roles sincronizado quando profile for atualizado
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se role mudou no profile, atualizar em user_roles
  IF (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.user_roles (user_id, organization_id, role)
    VALUES (NEW.id, NEW.organization_id, NEW.role)
    ON CONFLICT (user_id, organization_id) 
    DO UPDATE SET 
      role = EXCLUDED.role,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_profile_role_trigger
  AFTER INSERT OR UPDATE OF role, organization_id
  ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role IS NOT NULL)
  EXECUTE FUNCTION public.sync_profile_role_to_user_roles();