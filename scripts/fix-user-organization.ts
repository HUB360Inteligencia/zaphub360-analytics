/**
 * Script para corrigir a organização do usuário fabriciosouza85@gmail.com
 * 
 * Este script corrige o bug onde o AuthContext criava uma nova organização
 * a cada login quando havia race condition ou erro temporário.
 * 
 * Execute com: npx tsx scripts/fix-user-organization.ts
 */

import { createClient } from '@supabase/supabase-js';

// Você precisa definir estas variáveis de ambiente ou editá-las aqui
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Configurações
const USER_EMAIL = 'fabriciosouza85@gmail.com';
const CORRECT_ORG_ID = 'dab1df41-884f-4bb8-969a-c062a6aa8038';

async function fixUserOrganization() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
    console.error('Configure-as no arquivo .env ou edite o script diretamente');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔍 Buscando usuário:', USER_EMAIL);

  // 1. Buscar o usuário pelo email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('❌ Erro ao buscar usuários:', userError);
    process.exit(1);
  }

  const user = users.users.find(u => u.email === USER_EMAIL);
  
  if (!user) {
    console.error('❌ Usuário não encontrado:', USER_EMAIL);
    process.exit(1);
  }

  console.log('✅ Usuário encontrado:', user.id);

  // 2. Buscar o perfil atual do usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, organization_id, role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('❌ Erro ao buscar perfil:', profileError);
    process.exit(1);
  }

  console.log('📋 Perfil atual:');
  console.log('  - User ID:', profile.id);
  console.log('  - Email:', profile.email);
  console.log('  - Organização atual:', profile.organization_id);
  console.log('  - Role:', profile.role);

  // 3. Verificar se já está na organização correta
  if (profile.organization_id === CORRECT_ORG_ID) {
    console.log('✅ Usuário já está na organização correta!');
    console.log('Nenhuma ação necessária.');
    return;
  }

  const wrongOrgId = profile.organization_id;
  console.log('\n⚠️  Usuário está na organização INCORRETA');
  console.log('  - Organização errada:', wrongOrgId);
  console.log('  - Organização correta:', CORRECT_ORG_ID);

  // 4. Atualizar para a organização correta
  console.log('\n🔧 Atualizando usuário para a organização correta...');
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      organization_id: CORRECT_ORG_ID,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Erro ao atualizar perfil:', updateError);
    process.exit(1);
  }

  console.log('✅ Usuário atualizado com sucesso!');

  // 5. Verificar a organização incorreta
  if (wrongOrgId) {
    console.log('\n🔍 Verificando organização incorreta:', wrongOrgId);

    // Buscar info da organização incorreta
    const { data: wrongOrg } = await supabase
      .from('organizations')
      .select('id, name, slug, created_at')
      .eq('id', wrongOrgId)
      .single();

    if (wrongOrg) {
      console.log('📋 Organização incorreta:');
      console.log('  - Nome:', wrongOrg.name);
      console.log('  - Slug:', wrongOrg.slug);
      console.log('  - Criada em:', wrongOrg.created_at);
    }

    // Contar usuários nesta organização
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', wrongOrgId);

    // Contar campanhas nesta organização
    const { count: campaignsCount } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', wrongOrgId);

    console.log('  - Usuários restantes:', usersCount || 0);
    console.log('  - Campanhas:', campaignsCount || 0);

    // Se estiver vazia, desativar
    if ((usersCount || 0) === 0 && (campaignsCount || 0) === 0) {
      console.log('\n🗑️  Organização está vazia, desativando...');
      
      const { error: deactivateError } = await supabase
        .from('organizations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', wrongOrgId);

      if (deactivateError) {
        console.error('⚠️  Erro ao desativar organização:', deactivateError);
      } else {
        console.log('✅ Organização incorreta desativada');
      }
    } else {
      console.log('⚠️  Organização NÃO foi desativada (contém dados)');
    }
  }

  console.log('\n✨ Correção concluída com sucesso!');
  console.log('\n📝 Próximos passos:');
  console.log('1. Peça ao usuário para fazer logout e login novamente');
  console.log('2. Verifique se ele está na organização correta');
  console.log('3. O bug já foi corrigido no código (AuthContext.tsx)');
}

// Executar o script
fixUserOrganization()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

