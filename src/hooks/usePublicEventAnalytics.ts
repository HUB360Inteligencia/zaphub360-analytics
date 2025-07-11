
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventAnalytics {
  totalMessages: number;
  deliveredMessages: number;
  readMessages: number;
  responseMessages: number;
  queuedMessages: number;
  deliveryRate: number;
  readRate: number;
  responseRate: number;
  progressRate: number;
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

export const usePublicEventAnalytics = (eventId?: string) => {
  const eventAnalyticsQuery = useQuery({
    queryKey: ['public-event-analytics', eventId],
    queryFn: async (): Promise<EventAnalytics> => {
      if (!eventId) {
        return {
          totalMessages: 0,
          deliveredMessages: 0,
          readMessages: 0,
          responseMessages: 0,
          queuedMessages: 0,
          deliveryRate: 0,
          readRate: 0,
          responseRate: 0,
          progressRate: 0,
          hourlyActivity: [],
          statusDistribution: []
        };
      }

      // Primeiro, buscar o UUID do evento usando event_id
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('event_id', eventId)
        .single();

      if (eventError) {
        console.error('Error fetching event for analytics:', eventError);
        throw eventError;
      }

      // Buscar dados das mensagens usando o UUID do evento
      const { data: messages, error } = await supabase
        .from('event_messages')
        .select('*')
        .eq('event_id', eventData.id);

      if (error) {
        console.error('Error fetching public event analytics:', error);
        throw error;
      }

      // Normalizar status
      const normalizeStatus = (status: string): string => {
        const statusMapping: Record<string, string> = {
          'fila': 'fila',
          'queued': 'fila',
          'true': 'enviado',
          'READ': 'lido',
          'delivered': 'enviado',
          'sent': 'enviado',
          'read': 'lido',
          'responded': 'respondido',
          'failed': 'erro'
        };
        return statusMapping[status] || status.toLowerCase();
      };

      const normalizedMessages = (messages || []).map(msg => ({
        ...msg,
        status: normalizeStatus(msg.status)
      }));

      const totalMessages = normalizedMessages.length;
      const queuedMessages = normalizedMessages.filter(m => m.status === 'fila').length;
      const readMessages = normalizedMessages.filter(m => m.status === 'lido').length;
      const responseMessages = normalizedMessages.filter(m => m.status === 'respondido').length;
      
      // CORREÇÃO: Enviados agora inclui enviado + lido
      const deliveredMessages = normalizedMessages.filter(m => 
        m.status === 'enviado' || m.status === 'lido'
      ).length;

      // CORREÇÃO: Progresso é total - na fila
      const progressMessages = normalizedMessages.filter(m => m.status !== 'fila').length;
      const progressRate = totalMessages > 0 ? (progressMessages / totalMessages) * 100 : 0;

      const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
      const readRate = deliveredMessages > 0 ? (readMessages / deliveredMessages) * 100 : 0;
      const responseRate = readMessages > 0 ? (responseMessages / readMessages) * 100 : 0;

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
        messages: data.envio,
        delivered: data.envio,
        read: data.leitura,
        responded: data.resposta
      })).sort((a, b) => a.hour.localeCompare(b.hour));

      // Distribuição por status
      const statusCounts = new Map();
      normalizedMessages?.forEach(message => {
        const status = message.status || 'pendente';
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
        queuedMessages,
        deliveryRate,
        readRate,
        responseRate,
        progressRate,
        hourlyActivity,
        statusDistribution
      };
    },
    enabled: !!eventId,
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
