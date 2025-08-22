
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EventContact {
  id: string;
  contact_phone: string;
  contact_name?: string;
  status: string;
  sentiment?: string | null;
  profile?: string | null;
  created_at: string;
}

export interface ContactStats {
  total: number;
  fila: number;
  pendente: number;
  enviado: number;
  lido: number;
  respondido: number;
  erro: number;
  // Estatísticas de sentimento
  superEngajado: number;
  positivo: number;
  neutro: number;
  negativo: number;
  semClassificacao: number;
  // Estatísticas de perfil
  profileStats: Array<{
    profile: string;
    count: number;
    percentage: number;
  }>;
}

export const useEventContacts = (eventId?: string) => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ['event-contacts', eventId],
    queryFn: async (): Promise<EventContact[]> => {
      if (!eventId || !organization?.id) return [];

      const { data: messages, error } = await supabase
        .from('mensagens_enviadas')
        .select('id, celular, nome_contato, status, sentimento, perfil_contato, data_envio')
        .eq('id_campanha', eventId)
        .eq('organization_id', organization.id)
        .order('data_envio', { ascending: false });

      if (error) {
        console.error('Error fetching event contacts:', error);
        throw error;
      }

      // Transform data to match interface
      return (messages || []).map(msg => ({
        id: msg.id,
        contact_phone: msg.celular,
        contact_name: msg.nome_contato,
        status: msg.status,
        sentiment: msg.sentimento,
        profile: msg.perfil_contato,
        created_at: msg.data_envio
      }));
    },
    enabled: !!eventId && !!organization?.id,
  });

  const createEventContact = useMutation({
    mutationFn: async (contactData: {
      celular: string;
      evento: string;
      event_id: string;
      responsavel_cadastro: string;
    }) => {
      if (!organization?.id) throw new Error('Organization not found');

      const { data, error } = await supabase
        .from('new_contact_event')
        .insert({
          celular: contactData.celular,
          evento: contactData.evento,
          event_id: parseInt(contactData.event_id),
          organization_id: organization.id,
          responsavel_cadastro: contactData.responsavel_cadastro,
          status_envio: 'fila'
        })
        .select()
        .single();

      if (error) throw error;

      // Inserir na tabela mensagens_enviadas diretamente
      const { data: instanceData } = await supabase
        .from('instances')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (instanceData) {
        const { error: messageError } = await supabase
          .from('mensagens_enviadas')
          .insert({
            id_campanha: contactData.event_id,
            celular: contactData.celular,
            nome_contato: '',
            mensagem: '',
            organization_id: organization.id,
            status: 'fila',
            sentimento: null,
            instancia_id: instanceData.id,
            tipo_fluxo: 'evento'
          });

        if (messageError) throw messageError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-contacts'] });
      toast.success('Contato adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating contact:', error);
      toast.error('Erro ao adicionar contato');
    },
  });

  const deleteEventContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('mensagens_enviadas')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-contacts'] });
      toast.success('Contato removido com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting contact:', error);
      toast.error('Erro ao remover contato');
    },
  });

  const updateContactSentiment = useMutation({
    mutationFn: async ({ contactId, sentiment }: { contactId: string; sentiment: string | null }) => {
      const { error } = await supabase
        .from('mensagens_enviadas')
        .update({ sentimento: sentiment })
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['event-analytics'] });
      toast.success('Sentimento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating sentiment:', error);
      toast.error('Erro ao atualizar sentimento');
    },
  });

  const getContactStats = (): ContactStats => {
    const contacts = contactsQuery.data || [];
    
    // Profile statistics
    const profileCounts: Record<string, number> = {};
    contacts.forEach(contact => {
      const profile = contact.profile || 'Sem classificação';
      profileCounts[profile] = (profileCounts[profile] || 0) + 1;
    });

    const profileStats = Object.entries(profileCounts).map(([profile, count]) => ({
      profile,
      count,
      percentage: contacts.length > 0 ? (count / contacts.length) * 100 : 0
    }));
    
    return {
      total: contacts.length,
      fila: contacts.filter(c => c.status === 'fila').length,
      pendente: contacts.filter(c => c.status === 'pendente').length,
      enviado: contacts.filter(c => c.status === 'enviado').length,
      lido: contacts.filter(c => c.status === 'lido').length,
      respondido: contacts.filter(c => c.status === 'respondido').length,
      erro: contacts.filter(c => c.status === 'erro').length,
      // Estatísticas de sentimento
      superEngajado: contacts.filter(c => c.sentiment === 'super_engajado').length,
      positivo: contacts.filter(c => c.sentiment === 'positivo').length,
      neutro: contacts.filter(c => c.sentiment === 'neutro').length,
      negativo: contacts.filter(c => c.sentiment === 'negativo').length,
      semClassificacao: contacts.filter(c => c.sentiment === null || c.sentiment === undefined).length,
      profileStats
    };
  };

  return {
    contacts: contactsQuery.data || [],
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    createEventContact,
    deleteEventContact,
    updateContactSentiment,
    getContactStats,
  };
};
