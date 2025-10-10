-- Função para aceitar convite e vincular usuário à organização
CREATE OR REPLACE FUNCTION public.accept_invitation(
  p_token TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_result JSONB;
BEGIN
  -- Buscar convite válido
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  -- Verificar se convite existe e é válido
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Convite inválido ou expirado'
    );
  END IF;
  
  -- Atualizar perfil do usuário com organização e role
  UPDATE profiles
  SET 
    organization_id = v_invitation.organization_id,
    role = v_invitation.role,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Marcar convite como aceito
  UPDATE invitations
  SET 
    status = 'accepted',
    updated_at = NOW()
  WHERE id = v_invitation.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_invitation.organization_id,
    'role', v_invitation.role
  );
END;
$$;

-- Função trigger para processar convite automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.process_invite_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_token TEXT;
  v_result JSONB;
BEGIN
  -- Extrair token do convite dos metadados do usuário
  v_invite_token := NEW.raw_user_meta_data->>'invite_token';
  
  -- Se houver token, processar convite
  IF v_invite_token IS NOT NULL THEN
    v_result := accept_invitation(v_invite_token, NEW.id);
    
    -- Log do resultado
    IF v_result->>'success' = 'true' THEN
      RAISE LOG 'Convite aceito automaticamente para usuário %', NEW.id;
    ELSE
      RAISE WARNING 'Falha ao aceitar convite para usuário %: %', NEW.id, v_result->>'error';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para processar convite após inserção de usuário
DROP TRIGGER IF EXISTS on_auth_user_invited ON auth.users;
CREATE TRIGGER on_auth_user_invited
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'invite_token' IS NOT NULL)
  EXECUTE FUNCTION process_invite_on_signup();