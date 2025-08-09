import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CampaignMessage {
  id: string;
  id_campanha?: string;
  celular: string;
  nome_contato?: string;
  mensagem?: string;
  status: string;
  instancia_id?: string;
  tentativas_envio?: number;
  data_envio?: string;
  data_leitura?: string;
  data_resposta?: string;
  sentimento?: string;
  id_mensagem_wpp?: string;
  erro_envio?: string;
  prioridade?: number;
  tipo_fluxo: string;
  created_at?: string;
}

export const useCampaignMessages = (campaignId?: string) => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['campaign-messages', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      
      // Como estamos usando mensagens_enviadas que não tem id_campanha ainda,
      // vamos filtrar pela instância relacionada à campanha por enquanto
      const { data, error } = await supabase
        .from('mensagens_enviadas')
        .select('*')
        .eq('tipo_fluxo', 'campanha')
        .order('id', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        id_campanha: campaignId,
        celular: item.celular,
        nome_contato: item.nome_contato,
        mensagem: item.mensagem,
        status: item.status,
        instancia_id: item.instancia_id,
        // Mapear os campos corretos da tabela mensagens_enviadas
        tentativas_envio: 0, // Campo não existe ainda na tabela
        data_envio: item.data_envio,
        data_leitura: item.data_leitura,
        data_resposta: item.data_resposta,
        sentimento: item.sentimento,
        id_mensagem_wpp: item.id_mensagem_wpp,
        erro_envio: undefined, // Campo não existe ainda na tabela
        prioridade: 0, // Campo não existe ainda na tabela
        tipo_fluxo: item.tipo_fluxo,
        created_at: undefined, // Campo não existe na tabela atual
      }));
    },
    enabled: !!campaignId,
  });

  const createCampaignMessages = useMutation({
    mutationFn: async ({ 
      campaignId, 
      contacts, 
      messageContent,
      instanceIds 
    }: {
      campaignId: string;
      contacts: Array<{ phone: string; name: string }>;
      messageContent: string;
      instanceIds: string[];
    }) => {
      // Primeiro, criar relacionamentos campanha-instância
      if (instanceIds.length > 0) {
        const campaignInstances = instanceIds.map(instanceId => ({
          id_campanha: campaignId,
          id_instancia: instanceId,
          prioridade: 0
        }));

        const { error: instanceError } = await supabase
          .from('campanha_instancia')
          .upsert(campaignInstances, { onConflict: 'id_campanha,id_instancia' });

        if (instanceError) throw instanceError;
      }

      // Criar mensagens para cada contato e instância
      const messages = contacts.flatMap(contact => 
        instanceIds.map(instanceId => ({
          celular: contact.phone,
          nome_contato: contact.name,
          mensagem: messageContent,
          status: 'fila',
          instancia_id: instanceId,
          tipo_fluxo: 'campanha',
          // Campos da estrutura atual da tabela mensagens_enviadas
          'tempo delay': null,
          limite_inicio: null,
          limite_termino: null,
          tipo_mensagem: null,
          url_media: null,
          caption_media: null,
          mime_type: null,
          media_type: null,
          name_media: null,
          resposta_usuario: null,
        }))
      );

      const { data, error } = await supabase
        .from('mensagens_enviadas')
        .insert(messages)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-messages'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Mensagens da campanha criadas com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar mensagens da campanha:', error);
      toast.error('Erro ao criar mensagens da campanha');
    },
  });

  const getMessageStats = (messages: CampaignMessage[]) => {
    return {
      total: messages.length,
      queue: messages.filter(m => m.status === 'fila').length,
      sent: messages.filter(m => m.status === 'enviado').length,
      error: messages.filter(m => m.status === 'erro').length,
      blocked: messages.filter(m => m.status === 'bloqueado').length,
      read: messages.filter(m => m.data_leitura).length,
      replied: messages.filter(m => m.data_resposta).length,
    };
  };

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    createCampaignMessages,
    getMessageStats,
    refetch: messagesQuery.refetch,
  };
};