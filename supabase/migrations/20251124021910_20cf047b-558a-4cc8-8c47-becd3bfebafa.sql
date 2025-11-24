-- Remover policy antiga complexa que verifica permissões específicas
DROP POLICY IF EXISTS "Authorized users can manage checkin messages" 
  ON public.mensagens_checkin_eventos;

-- Criar nova policy simplificada - qualquer usuário da organização pode gerenciar mensagens de check-in
CREATE POLICY "Organization users can manage checkin messages"
ON public.mensagens_checkin_eventos
FOR ALL
TO public
USING (organization_id = get_user_organization_id())
WITH CHECK (organization_id = get_user_organization_id());