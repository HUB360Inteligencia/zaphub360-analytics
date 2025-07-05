import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EventAnalytics {
  totalMessages: number;
  deliveredMessages: number;
  readMessages: number;
  responseMessages: number;
  deliveryRate: number;
  readRate: number;
  responseRate: number;
  hourlyActivity: Array<{
    hour: string;
    messages: number;
    delivered: number;
    read: number;
    responded: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    color: string;
  }>;
}

export const useEventAnalytics = (eventId?: string) => {
  const { organization } = useAuth();

  const eventAnalyticsQuery = useQuery({
    queryKey: ['event-analytics', organization?.id, eventId],
    queryFn: async (): Promise<EventAnalytics> => {
      if (!organization?.id) {
        return {
          totalMessages: 0,
          deliveredMessages: 0,
          readMessages: 0,
          responseMessages: 0,
          deliveryRate: 0,
          readRate: 0,
          responseRate: 0,
          hourlyActivity: [],
          statusDistribution: []
        };
      }

      // Buscar dados dos contatos do evento (mais preciso que event_messages)
      let contactsQuery = supabase
        .from('new_contact_event')
        .select('*')
        .eq('organization_id', organization.id);

      let eventData = null;
      if (eventId) {
        // Buscar o event_id string da tabela events
        const { data: eventDataResult } = await supabase
          .from('events')
          .select('event_id')
          .eq('id', eventId)
          .single();

        eventData = eventDataResult;
        if (eventData?.event_id) {
          // Converter event_id string para numeric para comparar com new_contact_event
          const eventIdNumeric = parseInt(eventData.event_id);
          contactsQuery = contactsQuery.eq('event_id', eventIdNumeric);
        }
      }

      const { data: contacts, error } = await contactsQuery;

      if (error) {
        console.error('Error fetching event analytics:', error);
        throw error;
      }

      const totalMessages = contacts?.length || 0;
      const deliveredMessages = contacts?.filter(c => c.status_envio === 'enviado').length || 0;
      const readMessages = contacts?.filter(c => c.status_envio === 'lido').length || 0;
      const responseMessages = contacts?.filter(c => c.status_envio === 'respondido').length || 0;

      const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
      const readRate = deliveredMessages > 0 ? (readMessages / deliveredMessages) * 100 : 0;
      const responseRate = readMessages > 0 ? (responseMessages / readMessages) * 100 : 0;

      // Buscar dados de atividade por horário da tabela event_messages
      let messagesQuery = supabase
        .from('event_messages')
        .select('sent_at, read_at, responded_at')
        .eq('organization_id', organization.id);

      if (eventId && eventData?.event_id) {
        messagesQuery = messagesQuery.eq('event_id', eventId);
      }

      const { data: messages } = await messagesQuery;

      const hourlyData = new Map();
      
      // Inicializar todas as horas com 0
      for (let i = 0; i < 24; i++) {
        const hour = `${i.toString().padStart(2, '0')}:00`;
        hourlyData.set(hour, { envio: 0, leitura: 0, resposta: 0 });
      }

      // Processar dados das mensagens por timestamp real
      messages?.forEach(message => {
        if (message.sent_at) {
          const hour = new Date(message.sent_at).getHours();
          const key = `${hour.toString().padStart(2, '0')}:00`;
          const data = hourlyData.get(key);
          if (data) data.envio++;
        }
        
        if (message.read_at) {
          const hour = new Date(message.read_at).getHours();
          const key = `${hour.toString().padStart(2, '0')}:00`;
          const data = hourlyData.get(key);
          if (data) data.leitura++;
        }
        
        if (message.responded_at) {
          const hour = new Date(message.responded_at).getHours();
          const key = `${hour.toString().padStart(2, '0')}:00`;
          const data = hourlyData.get(key);
          if (data) data.resposta++;
        }
      });

      const hourlyActivity = Array.from(hourlyData.entries()).map(([hour, data]) => ({
        hour,
        messages: data.envio, // Manter compatibilidade
        delivered: data.envio, // Manter compatibilidade
        read: data.leitura,
        responded: data.resposta,
        envio: data.envio,
        leitura: data.leitura,
        resposta: data.resposta
      })).sort((a, b) => a.hour.localeCompare(b.hour));

      // Distribuição por status
      const statusCounts = new Map();
      contacts?.forEach(contact => {
        const status = contact.status_envio || 'pendente';
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      });

      const statusColors = {
        fila: '#6B7280',
        pendente: '#6B7280',
        enviado: '#3B82F6',
        lido: '#8B5CF6',
        respondido: '#10B981',
        erro: '#EF4444'
      };

      const statusDistribution = Array.from(statusCounts.entries()).map(([status, count]) => ({
        status,
        count,
        color: statusColors[status as keyof typeof statusColors] || '#9CA3AF'
      }));

      return {
        totalMessages,
        deliveredMessages,
        readMessages,
        responseMessages,
        deliveryRate,
        readRate,
        responseRate,
        hourlyActivity,
        statusDistribution
      };
    },
    enabled: !!organization?.id,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    analytics: eventAnalyticsQuery.data,
    isLoading: eventAnalyticsQuery.isLoading,
    error: eventAnalyticsQuery.error,
    refetch: eventAnalyticsQuery.refetch,
  };
};