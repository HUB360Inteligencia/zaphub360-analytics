
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CampaignMessage {
  id: number;
  id_campanha: string;
  contato: string;
  nome: string;
  content: string;
  status_mensagem: 'fila' | 'enviada' | 'erro' | 'instancia_bloqueada';
  instancia_id?: string;
  delay_mensagem?: number;
  tentativas_envio: number;
  horario_leitura?: string;
  horario_resposta?: string;
  sentimento_mensagem?: string;
  id_mensagem_wpp?: string;
  erro_envio?: string;
  prioridade: number;
  created_at: string;
}

export const useCampaignMessages = (campaignId?: string) => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['campaign-messages', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      
      const { data, error } = await supabase
        .from('mensagens_campanhas')
        .select('*')
        .eq('id_campanha', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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

      // Criar mensagens para cada contato
      const messages = contacts.map(contact => ({
        id_campanha: campaignId,
        contato: contact.phone,
        nome: contact.name,
        content: messageContent,
        status_mensagem: 'fila' as const,
        tentativas_envio: 0,
        prioridade: 0
      }));

      const { data, error } = await supabase
        .from('mensagens_campanhas')
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
      queue: messages.filter(m => m.status_mensagem === 'fila').length,
      sent: messages.filter(m => m.status_mensagem === 'enviada').length,
      error: messages.filter(m => m.status_mensagem === 'erro').length,
      blocked: messages.filter(m => m.status_mensagem === 'instancia_bloqueada').length,
      read: messages.filter(m => m.horario_leitura).length,
      replied: messages.filter(m => m.horario_resposta).length,
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
