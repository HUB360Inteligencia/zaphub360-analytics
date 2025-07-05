import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useErrorHandler } from './useErrorHandler';

export interface EventContact {
  id: string;
  contact_name: string | null;
  contact_phone: string;
  event_id: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  read_at: string | null;
  responded_at: string | null;
}

// Mapeamento de status do webhook para sistema brasileiro
const statusMapping: Record<string, string> = {
  'Fila': 'fila',
  'True': 'enviado',
  'READ': 'lido',
  'pendente': 'pendente',
  'enviado': 'enviado',
  'lido': 'lido',
  'respondido': 'respondido',
  'erro': 'erro'
};

const normalizeStatus = (status: string): string => {
  return statusMapping[status] || status.toLowerCase();
};

export const useEventContacts = (eventId?: string) => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  const eventContactsQuery = useQuery({
    queryKey: ['event-contacts', organization?.id, eventId],
    queryFn: async () => {
      if (!organization?.id) {
        return [];
      }

      // Buscar mensagens do evento usando UUID direto
      let messagesQuery = supabase
        .from('event_messages')
        .select('*')
        .eq('organization_id', organization.id);

      if (eventId) {
        messagesQuery = messagesQuery.eq('event_id', eventId);
      }

      messagesQuery = messagesQuery.order('created_at', { ascending: false });

      const { data, error } = await messagesQuery;

      if (error) {
        console.error('Error fetching event contacts:', error);
        throw error;
      }

      // Normalizar status das mensagens
      const normalizedData = (data || []).map(message => ({
        id: message.id,
        contact_name: message.contact_name,
        contact_phone: message.contact_phone,
        event_id: message.event_id,
        status: normalizeStatus(message.status || 'pendente'),
        created_at: message.created_at,
        sent_at: message.sent_at,
        read_at: message.read_at,
        responded_at: message.responded_at
      }));

      return normalizedData;
    },
    enabled: !!organization?.id,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createEventContact = useMutation({
    mutationFn: async (contactData: {
      celular: string;
      evento: string;
      event_id: string;
      responsavel_cadastro?: string;
    }) => {
      if (!organization?.id) {
        throw new Error('Organization not found');
      }

      // Formatar número no padrão DDI+DDD+número
      const formatPhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11 && cleaned.startsWith('55')) {
          return cleaned;
        }
        if (cleaned.length === 11) {
          return '55' + cleaned;
        }
        if (cleaned.length === 10) {
          return '5541' + cleaned;
        }
        return cleaned;
      };

      const { data, error } = await supabase
        .from('event_messages')
        .insert({
          contact_phone: formatPhone(contactData.celular),
          contact_name: contactData.responsavel_cadastro || 'manual',
          event_id: contactData.event_id,
          organization_id: organization.id,
          message_content: contactData.evento,
          status: 'queued'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-contacts'] });
      toast.success('Contato adicionado com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'Adicionar contato');
    },
  });

  const updateContactStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('event_messages')
        .update({ status: status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-contacts'] });
    },
    onError: (error) => {
      handleError(error, 'Atualizar status do contato');
    },
  });

  const deleteEventContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-contacts'] });
      toast.success('Contato removido com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'Remover contato');
    },
  });

  const getContactStats = () => {
    const contacts = eventContactsQuery.data || [];
    const total = contacts.length;
    const byStatus = contacts.reduce((acc, contact) => {
      const status = contact.status || 'pendente';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      fila: byStatus.fila || 0,
      pendente: byStatus.pendente || 0,
      enviado: byStatus.enviado || 0,
      lido: byStatus.lido || 0,
      respondido: byStatus.respondido || 0,
      erro: byStatus.erro || 0,
    };
  };

  return {
    contacts: eventContactsQuery.data || [],
    isLoading: eventContactsQuery.isLoading,
    error: eventContactsQuery.error,
    createEventContact,
    updateContactStatus,
    deleteEventContact,
    getContactStats,
    refetch: eventContactsQuery.refetch,
  };
};