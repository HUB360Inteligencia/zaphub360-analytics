
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContactEvent {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  status: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  message_content: string;
  status: string;
  sentiment: string | null;
  sent_at: string | null;
  read_at: string | null;
  responded_at: string | null;
  event_name: string;
  created_at: string;
}

export interface ContactProfileData {
  contact: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    avatar_url?: string;
    company?: string;
    created_at: string;
  } | null;
  events: ContactEvent[];
  messages: ContactMessage[];
  stats: {
    totalEvents: number;
    totalMessages: number;
    readMessages: number;
    respondedMessages: number;
    sentimentCounts: {
      superEngajado: number;
      positivo: number;
      neutro: number;
      negativo: number;
      semClassificacao: number;
    };
  };
}

export const useContactProfile = (contactPhone: string) => {
  const { organization } = useAuth();

  const profileQuery = useQuery({
    queryKey: ['contact-profile', contactPhone, organization?.id],
    queryFn: async (): Promise<ContactProfileData> => {
      if (!organization?.id || !contactPhone) {
        return {
          contact: null,
          events: [],
          messages: [],
          stats: {
            totalEvents: 0,
            totalMessages: 0,
            readMessages: 0,
            respondedMessages: 0,
            sentimentCounts: {
              superEngajado: 0,
              positivo: 0,
              neutro: 0,
              negativo: 0,
              semClassificacao: 0,
            },
          },
        };
      }

      // Buscar contato na tabela contacts
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, name, phone, email, avatar_url, company, created_at')
        .eq('phone', contactPhone)
        .eq('organization_id', organization.id)
        .single();

      // Buscar mensagens do contato
      const { data: messages, error: messagesError } = await supabase
        .from('event_messages')
        .select(`
          id,
          message_content,
          status,
          sentiment,
          sent_at,
          read_at,
          responded_at,
          created_at,
          events!inner(name)
        `)
        .eq('contact_phone', contactPhone)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching contact messages:', messagesError);
      }

      // Buscar eventos únicos onde o contato participou
      const { data: eventMessages } = await supabase
        .from('event_messages')
        .select(`
          event_id,
          events!inner(id, name, event_date, location, status, created_at)
        `)
        .eq('contact_phone', contactPhone)
        .eq('organization_id', organization.id);

      // Remover eventos duplicados
      const uniqueEvents: ContactEvent[] = [];
      const eventIds = new Set();
      
      eventMessages?.forEach(item => {
        if (!eventIds.has(item.event_id)) {
          eventIds.add(item.event_id);
          uniqueEvents.push({
            id: item.events.id,
            name: item.events.name,
            event_date: item.events.event_date,
            location: item.events.location,
            status: item.events.status,
            created_at: item.events.created_at,
          });
        }
      });

      // Processar mensagens
      const processedMessages: ContactMessage[] = (messages || []).map(msg => ({
        id: msg.id,
        message_content: msg.message_content,
        status: msg.status,
        sentiment: msg.sentiment,
        sent_at: msg.sent_at,
        read_at: msg.read_at,
        responded_at: msg.responded_at,
        event_name: (msg as any).events?.name || 'Evento não encontrado',
        created_at: msg.created_at,
      }));

      // Calcular estatísticas
      const stats = {
        totalEvents: uniqueEvents.length,
        totalMessages: processedMessages.length,
        readMessages: processedMessages.filter(m => m.read_at).length,
        respondedMessages: processedMessages.filter(m => m.responded_at).length,
        sentimentCounts: {
          superEngajado: processedMessages.filter(m => m.sentiment === 'super_engajado').length,
          positivo: processedMessages.filter(m => m.sentiment === 'positivo').length,
          neutro: processedMessages.filter(m => m.sentiment === 'neutro').length,
          negativo: processedMessages.filter(m => m.sentiment === 'negativo').length,
          semClassificacao: processedMessages.filter(m => m.sentiment === null).length,
        },
      };

      return {
        contact,
        events: uniqueEvents,
        messages: processedMessages,
        stats,
      };
    },
    enabled: !!contactPhone && !!organization?.id,
  });

  return {
    profileData: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
  };
};
