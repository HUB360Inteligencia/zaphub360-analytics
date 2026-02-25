
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useErrorHandler } from './useErrorHandler';

export interface Campaign {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'active' | 'disparando' | 'paused' | 'completed' | 'cancelled';
  organization_id: string;
  template_id?: string;
  target_contacts?: any;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  // Novos campos para integração N8n
  intervalo_minimo: number;
  intervalo_maximo: number;
  horario_disparo_inicio: string;
  horario_disparo_fim: string;
  tipo_conteudo: string[];
  total_mensagens: number;
  mensagens_enviadas: number;
  mensagens_lidas: number;
  mensagens_respondidas: number;
  created_at: string;
  updated_at: string;
  // Campos de mídia e tipo de mensagem
  id_tipo_mensagem?: number;
  message_text?: string;
  url_media?: string;
  name_media?: string;
  mime_type?: string;
  media_type?: string;
}

export const useCampaigns = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const { handleError, validateRequired } = useErrorHandler();

  const campaignsQuery = useQuery({
    queryKey: ['campaigns', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.warn('No organization ID available for campaigns query');
        return [];
      }
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
      }
      
      // Buscar métricas reais das mensagens para cada campanha
      const campaignsWithMetrics = await Promise.all((data || []).map(async (campaign) => {
        // Contagens alinhadas com CampaignDetails
        const [
          { count: totalCount, error: totalError },
          { count: queueCount, error: queueError },
          { count: sentProcessedCount, error: sentProcessedError },
          { count: respondedCount, error: respondedError },
        ] = await Promise.all([
          supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('id_campanha', campaign.id),
          supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('id_campanha', campaign.id)
            .in('status', ['fila', 'pendente', 'processando']),
          supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('id_campanha', campaign.id)
            .in('status', ['enviado', 'erro']),
          supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('id_campanha', campaign.id)
            .not('data_resposta', 'is', null),
        ]);

        if (totalError || queueError || sentProcessedError || respondedError) {
          console.error('Error counting campaign messages:', { totalError, queueError, sentProcessedError, respondedError });
        }

        const totalMessages = totalCount || 0;
        const queuedMessages = queueCount || 0;
        const sentProcessed = sentProcessedCount || 0;
        const respondedMessages = respondedCount || 0;
        
        return {
          ...campaign,
          intervalo_minimo: campaign.intervalo_minimo || 30,
          intervalo_maximo: campaign.intervalo_maximo || 60,
          horario_disparo_inicio: campaign.horario_disparo_inicio || '09:00:00',
          horario_disparo_fim: campaign.horario_disparo_fim || '20:00:00',
          tipo_conteudo: campaign.tipo_conteudo || ['texto'],
          total_mensagens: totalMessages,
          mensagens_enviadas: sentProcessed,
          mensagens_lidas: campaign.mensagens_lidas || 0,
          mensagens_respondidas: respondedMessages,
          target_contacts: campaign.target_contacts || { contacts: [] },
          status: campaign.status || 'draft',
          id_tipo_mensagem: campaign.id_tipo_mensagem || 1,
          // Expor métricas para consumo pelo Dashboard e Campaigns
          metrics: {
            total: totalMessages,
            fila: queuedMessages,
            sent: sentProcessed,
            respondidos: respondedMessages,
          },
        };
      }));
      
      return campaignsWithMetrics;
    },
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createCampaign = useMutation({
    mutationFn: async (campaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
      // Validar campos obrigatórios
      if (!validateRequired(campaignData, ['name', 'organization_id'])) {
        throw new Error('Campos obrigatórios não preenchidos');
      }

      // Gerar slug usando a função do banco com tratamento de erro
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_campaign_slug', {
          campaign_name: campaignData.name.trim(),
          org_id: campaignData.organization_id
        });

      if (slugError) {
        console.error('Erro ao gerar slug:', slugError);
      }

      // Fallback robusto com tratamento de acentos
      const generateFallbackSlug = (name: string): string => {
        const slug = name
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''); // Remove hífens do início/fim
        return slug || `campanha-${Date.now()}`;
      };

      // Sanitizar dados
      const sanitizedData = {
        ...campaignData,
        name: campaignData.name.trim(),
        slug: slugData || generateFallbackSlug(campaignData.name.trim()),
        description: campaignData.description?.trim() || null,
        intervalo_minimo: campaignData.intervalo_minimo || 30,
        intervalo_maximo: campaignData.intervalo_maximo || 60,
        horario_disparo_inicio: campaignData.horario_disparo_inicio || '09:00:00',
        horario_disparo_fim: campaignData.horario_disparo_fim || '20:00:00',
        tipo_conteudo: campaignData.tipo_conteudo || ['texto'],
        total_mensagens: 0,
        mensagens_enviadas: 0,
        mensagens_lidas: 0,
        mensagens_respondidas: 0,
        target_contacts: campaignData.target_contacts || { contacts: [] },
        status: campaignData.status || 'draft',
        scheduled_at: campaignData.scheduled_at || null,
        started_at: null,
        completed_at: null
      };

      const { data, error } = await supabase
        .from('campaigns')
        .insert(sanitizedData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'Criar campanha');
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Se os intervalos foram atualizados, atualizar tempo_delay das mensagens não enviadas
      if (updateData.intervalo_minimo !== undefined || updateData.intervalo_maximo !== undefined) {
        const minDelay = updateData.intervalo_minimo || data.intervalo_minimo || 30;
        const maxDelay = updateData.intervalo_maximo || data.intervalo_maximo || 60;

        // Buscar mensagens não enviadas desta campanha
        const { data: pendingMessages, error: messagesError } = await supabase
          .from('mensagens_enviadas')
          .select('id')
          .eq('id_campanha', id)
          .eq('status', 'pendente');

        if (!messagesError && pendingMessages && pendingMessages.length > 0) {
          // Atualizar tempo_delay para cada mensagem pendente
          const updates = pendingMessages.map(message => {
            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            return supabase
              .from('mensagens_enviadas')
              .update({ 'tempo delay': randomDelay })
              .eq('id', message.id);
          });

          await Promise.all(updates);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar campanha:', error);
      toast.error('Erro ao atualizar campanha');
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir campanha:', error);
      toast.error('Erro ao excluir campanha');
    },
  });

  // Nova função para ativar campanha
  const activateCampaign = useMutation({
    mutationFn: async ({ id, targetContacts, templateData }: { 
      id: string; 
      targetContacts: any[];
      templateData?: any;
    }) => {
      console.log('Activating campaign with contacts:', targetContacts);

      // Buscar dados da campanha
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError) throw campaignError;

      // Buscar instâncias ativas da organização
      const { data: instances, error: instancesError } = await supabase
        .from('instances')
        .select('id')
        .eq('organization_id', campaign.organization_id)
        .eq('status', 'active');

      if (instancesError) throw instancesError;

      if (!instances || instances.length === 0) {
        throw new Error('Nenhuma instância ativa encontrada para disparar a campanha');
      }

      const activeInstanceIds = instances.map(i => i.id);

      // Buscar contatos que já têm mensagens na campanha (enviadas ou pendentes)
      const { data: existingMessages, error: existingError } = await supabase
        .from('mensagens_enviadas')
        .select('celular')
        .eq('id_campanha', id)
        .in('status', ['enviado', 'enviada', 'fila', 'pendente', 'processando']);
        
      if (existingError) {
        console.error('Erro ao buscar mensagens existentes:', existingError);
      }
      
      const existingPhones = new Set(existingMessages?.map(m => m.celular) || []);
      console.log(`Found ${existingPhones.size} contacts with existing messages`);
      
      // Filtrar contatos que ainda não têm mensagens
      const contactsToAdd = targetContacts.filter(contact => 
        !existingPhones.has(contact.phone || contact.celular)
      );
      console.log(`Will add ${contactsToAdd.length} new contacts (${targetContacts.length - contactsToAdd.length} ignored as duplicates)`);

      if (contactsToAdd.length === 0) {
        // Ainda ativar a campanha mesmo sem novos contatos
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({
            status: 'active',
            started_at: new Date().toISOString()
          })
          .eq('id', id);

        if (updateError) throw updateError;
        console.log('Campaign activated without new contacts');
        return campaign;
      }

      // Preparar mensagens para inserção na tabela mensagens_enviadas (apenas contatos novos)
      const messages = contactsToAdd.map((contact, index) => {
        // Verificar se a última instância do contato ainda está ativa
        let instanceId;
        if (contact.ultima_instancia && activeInstanceIds.includes(contact.ultima_instancia)) {
          instanceId = contact.ultima_instancia;
        } else {
          // Usar instância aleatória das ativas
          instanceId = instances[Math.floor(Math.random() * instances.length)].id;
        }

        // Gerar delay aleatório entre intervalo mínimo e máximo (em segundos)
        const minDelay = campaign.intervalo_minimo || 30;
        const maxDelay = campaign.intervalo_maximo || 60;
        const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

        // Usar dados da campanha se templateData não fornecido
        const messageData = templateData || campaign;

        return {
          tipo_fluxo: 'campanha',
          celular: contact.phone || contact.celular,
          instancia_id: instanceId,
          status: 'pendente',
          mensagem: messageData.message_text || messageData.content || null,
          media_type: messageData.media_type || null,
          name_media: messageData.name_media || null,
          url_media: messageData.url_media || null,
          caption_media: messageData.caption_media || messageData.message_text || messageData.content || null,
          mime_type: messageData.mime_type || null,
          nome_contato: contact.name,
          id_campanha: id,
          organization_id: campaign.organization_id,
          id_tipo_mensagem: campaign.id_tipo_mensagem || 1,
          'tempo delay': randomDelay
        };
      });

      // Inserir mensagens na tabela mensagens_enviadas em lotes
      const BATCH_SIZE = 100;
      let insertedCount = 0;
      
      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batch = messages.slice(i, i + BATCH_SIZE);
        const { error: batchError } = await supabase
          .from('mensagens_enviadas')
          .insert(batch);
          
        if (batchError) {
          console.error(`Erro ao inserir lote ${i / BATCH_SIZE + 1}:`, batchError);
          throw batchError;
        }
        
        insertedCount += batch.length;
      }
      
      console.log(`Successfully inserted ${insertedCount} messages`);

      // Atualizar métricas da campanha
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          total_mensagens: insertedCount,
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha ativada! Mensagens sendo preparadas para disparo.');
    },
    onError: (error) => {
      console.error('Erro ao ativar campanha:', error);
      toast.error(error.message || 'Erro ao ativar campanha');
    },
  });

  // Nova função para pausar campanha (atômica: atualiza mensagens e registra batch)
  const pauseCampaign = useMutation({
  mutationFn: async (id: string) => {
  // Buscar campanha para obter organization_id
  const { data: campaign, error: campaignError } = await supabase
  .from('campaigns')
  .select('id, organization_id')
  .eq('id', id)
  .single();
  
  if (campaignError) throw campaignError;
  
  // Chamar RPC que atualiza mensagens (pendente/processando -> fila) e retorna batch_id/message_ids
  const { data: rpcResult, error: rpcError } = await supabase
  .rpc('rpc_pause_campaign_messages', {
  org_id: campaign.organization_id,
  campaign_id: id,
  performed_by: profile?.id || null
  });
  
  if (rpcError) {
  console.error('Erro ao executar RPC pause:', rpcError);
  throw rpcError;
  }
  
  const batchId = (Array.isArray(rpcResult) && rpcResult.length > 0) ? rpcResult[0].batch_id : null;
  
  // Atualizar o status da campanha
  const { data: updatedCampaign, error: updateError } = await supabase
  .from('campaigns')
  .update({
  status: 'paused',
  updated_at: new Date().toISOString()
  })
  .eq('id', id)
  .select()
  .single();
  
  if (updateError) throw updateError;
  
  return { campaign: updatedCampaign, pauseBatchId: batchId };
  },
  onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  toast.success('Campanha pausada com sucesso!');
  },
  onError: (error) => {
  console.error('Erro ao pausar campanha:', error);
  toast.error('Erro ao pausar campanha');
  },
  });

  // Função para retomar campanha (usa batch_id para desfazer alterações realizadas durante a pausa)
  const resumeCampaign = useMutation({
    mutationFn: async ({ id, batchId }: { id: string; batchId?: string }) => {
      // Buscar campanha para organization_id
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, organization_id')
        .eq('id', id)
        .single();

      if (campaignError) throw campaignError;

      let targetBatchId = batchId;

      // Se nenhum batchId for fornecido, buscar o último registro de auditoria para esta campanha
      if (!targetBatchId) {
        const { data: rows, error: rowsError } = await supabase
          .from('campaign_message_audits')
          .select('batch_id')
          .eq('campaign_id', id)
          .order('performed_at', { ascending: false })
          .limit(1);

        if (rowsError) throw rowsError;
        if (!rows || rows.length === 0) throw new Error('Nenhum batch de pausa encontrado para esta campanha');
        targetBatchId = rows[0].batch_id;
      }

      // Chamar RPC que reverte mensagens do batch para 'pendente'
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('rpc_resume_campaign_messages', {
          org_id: campaign.organization_id,
          campaign_id: id,
          target_batch_id: targetBatchId,
          performed_by: profile?.id || null
        });

      if (rpcError) {
        console.error('Erro ao executar RPC resume:', rpcError);
        throw rpcError;
      }

      // Atualizar o status da campanha para active
      const { data: updatedCampaign, error: updateError } = await supabase
        .from('campaigns')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return { campaign: updatedCampaign, resumedMessageIds: rpcResult };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha retomada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao retomar campanha:', error);
      toast.error('Erro ao retomar campanha');
    },
  });

  return {
    campaigns: campaignsQuery.data || [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    activateCampaign,
    pauseCampaign,
    resumeCampaign,
    refetch: campaignsQuery.refetch,
  };
};
