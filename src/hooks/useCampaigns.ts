
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useErrorHandler } from './useErrorHandler';

export interface Campaign {
  id: string;
  name: string;
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
}

export const useCampaigns = () => {
  const { organization } = useAuth();
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
      
      // Validar e sanitizar dados com novos campos
      const validCampaigns = (data || []).map(campaign => ({
        ...campaign,
        intervalo_minimo: campaign.intervalo_minimo || 30,
        intervalo_maximo: campaign.intervalo_maximo || 60,
        horario_disparo_inicio: campaign.horario_disparo_inicio || '09:00:00',
        horario_disparo_fim: campaign.horario_disparo_fim || '20:00:00',
        tipo_conteudo: campaign.tipo_conteudo || ['texto'],
        total_mensagens: campaign.total_mensagens || 0,
        mensagens_enviadas: campaign.mensagens_enviadas || 0,
        mensagens_lidas: campaign.mensagens_lidas || 0,
        mensagens_respondidas: campaign.mensagens_respondidas || 0,
        target_contacts: campaign.target_contacts || { contacts: [] },
        status: campaign.status || 'draft'
      }));
      
      return validCampaigns;
    },
    enabled: !!organization?.id,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createCampaign = useMutation({
    mutationFn: async (campaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
      // Validar campos obrigatórios
      if (!validateRequired(campaignData, ['name', 'organization_id'])) {
        throw new Error('Campos obrigatórios não preenchidos');
      }

      // Sanitizar dados
      const sanitizedData = {
        ...campaignData,
        name: campaignData.name.trim(),
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
      // Primeiro, atualizar status para "active"
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
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

      // Preparar mensagens para inserção na tabela mensagens_enviadas
      const messages = targetContacts.map((contact, index) => {
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

        return {
          tipo_fluxo: 'campanha',
          celular: contact.phone,
          instancia_id: instanceId,
          status: 'pendente',
          media_type: templateData?.media_type || null,
          name_media: templateData?.name_media || null,
          url_media: templateData?.url_media || null,
          caption_media: templateData?.caption_media || templateData?.content || null,
          mime_type: templateData?.mime_type || null,
          nome_contato: contact.name,
          id_campanha: id,
          organization_id: campaign.organization_id,
          'tempo delay': randomDelay
        };
      });

      // Inserir mensagens na tabela mensagens_enviadas
      const { error: messagesError } = await supabase
        .from('mensagens_enviadas')
        .insert(messages);

      if (messagesError) throw messagesError;

      // Atualizar métricas da campanha
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          total_mensagens: messages.length,
          status: 'active'
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

  // Nova função para pausar campanha
  const pauseCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha pausada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao pausar campanha:', error);
      toast.error('Erro ao pausar campanha');
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
    refetch: campaignsQuery.refetch,
  };
};
