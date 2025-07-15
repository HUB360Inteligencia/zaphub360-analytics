
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
}

export const useEventContacts = (eventId?: string) => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ['event-contacts', eventId],
    queryFn: async (): Promise<EventContact[]> => {
      if (!eventId || !organization?.id) return [];

      const { data: messages, error } = await supabase
        .from('event_messages')
        .select('id, contact_phone, contact_name, status, sentiment, created_at')
        .eq('event_id', eventId)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching event contacts:', error);
        throw error;
      }

      return messages || [];
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

      // Também inserir na tabela event_messages
      const { error: messageError } = await supabase
        .from('event_messages')
        .insert({
          event_id: contactData.event_id,
          contact_phone: contactData.celular,
          contact_name: '',
          message_content: '',
          organization_id: organization.id,
          status: 'fila',
          sentiment: null
        });

      if (messageError) throw messageError;

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
        .from('event_messages')
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
        .from('event_messages')
        .update({ sentiment })
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
