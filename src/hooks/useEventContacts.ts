import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useErrorHandler } from './useErrorHandler';

export interface EventContact {
  id_contact_event: number;
  name: string | null;
  celular: string | null;
  evento: string | null;
  responsavel_cadastro: string | null;
  organization_id: string | null;
  status_envio: string;
  event_id: string | null;
  created_at: string;
  updated_at: string | null;
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

      if (eventId) {
        // Buscar o event_id string da tabela events usando o UUID
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('event_id')
          .eq('id', eventId)
          .single();

        if (eventError) {
          console.error('Error fetching event:', eventError);
          throw eventError;
        }

        if (!eventData?.event_id) {
          return [];
        }

        // Buscar contatos usando o event_id string
        const { data, error } = await supabase
          .from('new_contact_event')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('event_id', eventData.event_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching event contacts:', error);
          throw error;
        }

        // Normalizar status dos contatos
        const normalizedData = (data || []).map(contact => ({
          ...contact,
          status_envio: normalizeStatus(contact.status_envio || 'pendente')
        }));

        return normalizedData;
      } else {
        // Buscar todos os contatos da organização
        const { data, error } = await supabase
          .from('new_contact_event')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching event contacts:', error);
          throw error;
        }

        // Normalizar status dos contatos
        const normalizedData = (data || []).map(contact => ({
          ...contact,
          status_envio: normalizeStatus(contact.status_envio || 'pendente')
        }));

        return normalizedData;
      }
    },
    enabled: !!organization?.id,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createEventContact = useMutation({
    mutationFn: async (contactData: {
      name: string;
      celular: string;
      evento: string;
      event_id: string;
      responsavel_cadastro?: string;
    }) => {
      if (!organization?.id) {
        throw new Error('Organization not found');
      }

      // Buscar o event_id string da tabela events
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('event_id')
        .eq('id', contactData.event_id)
        .single();

      if (eventError) throw eventError;

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
        .from('new_contact_event')
        .insert({
          name: contactData.name.trim(),
          celular: formatPhone(contactData.celular),
          evento: contactData.evento,
          event_id: eventData.event_id, // Usar o event_id string
          organization_id: organization.id,
          responsavel_cadastro: contactData.responsavel_cadastro || 'manual',
          status_envio: 'pendente'
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
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { data, error } = await supabase
        .from('new_contact_event')
        .update({ status_envio: status })
        .eq('id_contact_event', id)
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
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('new_contact_event')
        .delete()
        .eq('id_contact_event', id);

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
      const status = contact.status_envio || 'pendente';
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