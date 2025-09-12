import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeSentiment, SENTIMENT_VALUES } from '@/lib/sentiment';

export interface EventAnalytics {
  totalMessages: number;
  sentMessages: number;
  deliveredMessages: number;
  readMessages: number;
  responseMessages: number;
  queuedMessages: number;
  errorMessages: number;
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
  sentimentAnalysis: {
    superEngajado: number;
    positivo: number;
    neutro: number;
    negativo: number;
    semClassificacao: number;
    distribution: Array<{
      sentiment: string;
      count: number;
      percentage: number;
      color: string;
      emoji: string;
    }>;
  };
  profileAnalysis: {
    distribution: Array<{
      profile: string;
      count: number;
      percentage: number;
      color: string;
    }>;
  };
}

export const usePublicEventAnalytics = (eventId?: string) => {
  const eventAnalyticsQuery = useQuery({
    queryKey: ['public-event-analytics', eventId],
    queryFn: async (): Promise<EventAnalytics> => {
      if (!eventId) {
        return {
          totalMessages: 0,
          sentMessages: 0,
          deliveredMessages: 0,
          readMessages: 0,
          responseMessages: 0,
          queuedMessages: 0,
          errorMessages: 0,
          deliveryRate: 0,
          readRate: 0,
          responseRate: 0,
          progressRate: 0,
          hourlyActivity: [],
          statusDistribution: [],
          sentimentAnalysis: {
            superEngajado: 0,
            positivo: 0,
            neutro: 0,
            negativo: 0,
            semClassificacao: 0,
            distribution: []
          },
          profileAnalysis: {
            distribution: []
          }
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
        .from('mensagens_enviadas')
        .select('*')
        .eq('id_campanha', eventData.id);

      if (error) {
        console.error('Error fetching public event analytics:', error);
        throw error;
      }

      const normalizeStatus = (status: string): string => {
        const statusMapping: Record<string, string> = {
          'fila': 'fila',
          'queued': 'fila',
          'pendente': 'fila', // Normalize pendente to fila
          'processando': 'fila', // Normalize processando to fila
          'pending': 'fila', // Normalize pending to fila
          'processing': 'fila', // Normalize processing to fila
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
        status: normalizeStatus(msg.status),
        sentiment: msg.sentimento,
        sent_at: msg.data_envio,
        read_at: msg.data_leitura,
        responded_at: msg.data_resposta
      }));

      // Defaults from loaded page (may be limited to 1000)
      let totalMessages = normalizedMessages.length;
      let queuedMessages = normalizedMessages.filter(m => m.status === 'fila').length;
      let readMessages = normalizedMessages.filter(m => m.status === 'lido').length;
      let responseMessages = normalizedMessages.filter(m => m.responded_at != null).length;
      let errorMessages = normalizedMessages.filter(m => m.status === 'erro').length;
      let deliveredMessages = normalizedMessages.filter(m => m.status === 'enviado').length;
      let sentMessages = deliveredMessages + errorMessages;

      // Override with exact counts from server to avoid 1000 cap
      try {
        const commonFilters = (q: any) => q.eq('id_campanha', eventData.id);

        const [
          totalRes,
          queuedRes,
          readRes,
          respondedRes,
          errorRes,
          deliveredRes
        ] = await Promise.all([
          commonFilters(supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true })),
          commonFilters(supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true })).in('status', ['fila','pendente','processando']),
          commonFilters(supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true })).eq('status', 'lido'),
          commonFilters(supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true })).not('data_resposta', 'is', null),
          commonFilters(supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true })).eq('status', 'erro'),
          commonFilters(supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true })).eq('status', 'enviado'),
        ]);

        if ((totalRes.count ?? 0) > 0) {
          totalMessages = totalRes.count || 0;
          queuedMessages = queuedRes.count || 0;
          readMessages = readRes.count || 0;
          responseMessages = respondedRes.count || 0;
          errorMessages = errorRes.count || 0;
          deliveredMessages = deliveredRes.count || 0;
          sentMessages = deliveredMessages + errorMessages;
        } else {
          // Fallback to event_messages
          const emFilters = (q: any) => q.eq('event_id', eventData.id);
          const [
            total2,
            queued2,
            read2,
            responded2,
            error2,
            delivered2
          ] = await Promise.all([
            emFilters(supabase.from('event_messages').select('*', { count: 'exact', head: true })),
            emFilters(supabase.from('event_messages').select('*', { count: 'exact', head: true })).in('status', ['queued','pending','processing']),
            emFilters(supabase.from('event_messages').select('*', { count: 'exact', head: true })).not('read_at', 'is', null),
            emFilters(supabase.from('event_messages').select('*', { count: 'exact', head: true })).not('responded_at', 'is', null),
            emFilters(supabase.from('event_messages').select('*', { count: 'exact', head: true })).eq('status', 'failed'),
            emFilters(supabase.from('event_messages').select('*', { count: 'exact', head: true })).in('status', ['sent','delivered']),
          ]);

          if ((total2.count ?? 0) > 0) {
            totalMessages = total2.count || 0;
            queuedMessages = queued2.count || 0;
            readMessages = read2.count || 0;
            responseMessages = responded2.count || 0;
            errorMessages = error2.count || 0;
            deliveredMessages = delivered2.count || 0;
            sentMessages = deliveredMessages + errorMessages;
          }
        }
      } catch (e) {
        console.warn('Falling back to client-side counts due to error:', e);
      }

      // CORREÇÃO: Progresso é total - na fila
      const progressMessages = normalizedMessages.filter(m => m.status !== 'fila').length;
      const progressRate = totalMessages > 0 ? (progressMessages / totalMessages) * 100 : 0;

      const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
      const readRate = deliveredMessages > 0 ? (readMessages / deliveredMessages) * 100 : 0;
      const responseRate = readMessages > 0 ? (responseMessages / readMessages) * 100 : 0;

      // sentiment analysis logic
      const sentimentCounts = {
        [SENTIMENT_VALUES.SUPER_ENGAJADO]: normalizedMessages.filter(m => normalizeSentiment(m.sentiment) === SENTIMENT_VALUES.SUPER_ENGAJADO).length,
        [SENTIMENT_VALUES.POSITIVO]: normalizedMessages.filter(m => normalizeSentiment(m.sentiment) === SENTIMENT_VALUES.POSITIVO).length,
        [SENTIMENT_VALUES.NEUTRO]: normalizedMessages.filter(m => normalizeSentiment(m.sentiment) === SENTIMENT_VALUES.NEUTRO).length,
        [SENTIMENT_VALUES.NEGATIVO]: normalizedMessages.filter(m => normalizeSentiment(m.sentiment) === SENTIMENT_VALUES.NEGATIVO).length,
        sem_classificacao: normalizedMessages.filter(m => m.sentiment === null || m.sentiment === undefined).length,
      };

      const sentimentTotal = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);

      const sentimentDistribution = [
        {
          sentiment: 'Super Engajado',
          count: sentimentCounts[SENTIMENT_VALUES.SUPER_ENGAJADO],
          percentage: sentimentTotal > 0 ? (sentimentCounts[SENTIMENT_VALUES.SUPER_ENGAJADO] / sentimentTotal) * 100 : 0,
          color: '#FF6B35',
          emoji: '🔥'
        },
        {
          sentiment: 'Positivo',
          count: sentimentCounts[SENTIMENT_VALUES.POSITIVO],
          percentage: sentimentTotal > 0 ? (sentimentCounts[SENTIMENT_VALUES.POSITIVO] / sentimentTotal) * 100 : 0,
          color: '#10B981',
          emoji: '😊'
        },
        {
          sentiment: 'Neutro',
          count: sentimentCounts[SENTIMENT_VALUES.NEUTRO],
          percentage: sentimentTotal > 0 ? (sentimentCounts[SENTIMENT_VALUES.NEUTRO] / sentimentTotal) * 100 : 0,
          color: '#6B7280',
          emoji: '😐'
        },
        {
          sentiment: 'Negativo',
          count: sentimentCounts[SENTIMENT_VALUES.NEGATIVO],
          percentage: sentimentTotal > 0 ? (sentimentCounts[SENTIMENT_VALUES.NEGATIVO] / sentimentTotal) * 100 : 0,
          color: '#DC2626',
          emoji: '😞'
        },
        {
          sentiment: 'Sem Classificação',
          count: sentimentCounts.sem_classificacao,
          percentage: sentimentTotal > 0 ? (sentimentCounts.sem_classificacao / sentimentTotal) * 100 : 0,
          color: '#9CA3AF',
          emoji: '⚪'
        }
      ];

      // Profile analysis
      const profileCounts: Record<string, number> = {};
      normalizedMessages.forEach(msg => {
        const profile = msg.perfil_contato || 'Sem classificação';
        profileCounts[profile] = (profileCounts[profile] || 0) + 1;
      });

      const profileTotal = Object.values(profileCounts).reduce((a, b) => a + b, 0);
      const profileColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];
      
      const profileDistribution = Object.entries(profileCounts).map(([profile, count], index) => ({
        profile,
        count,
        percentage: profileTotal > 0 ? (count / profileTotal) * 100 : 0,
        color: profileColors[index % profileColors.length]
      }));

      // hourly activity and status distribution logic
      const hourlyData = new Map();
      
      // Inicializar todas as horas com 0
      for (let i = 0; i < 24; i++) {
        const hour = `${i.toString().padStart(2, '0')}:00`;
        hourlyData.set(hour, { envio: 0, leitura: 0, resposta: 0 });
      }

      // Processar dados das mensagens por timestamp real
      messages?.forEach(message => {
        if (message.data_envio) {
          const hour = new Date(message.data_envio).getHours();
          const key = `${hour.toString().padStart(2, '0')}:00`;
          const data = hourlyData.get(key);
          if (data) data.envio++;
        }
        
        if (message.data_leitura) {
          const hour = new Date(message.data_leitura).getHours();
          const key = `${hour.toString().padStart(2, '0')}:00`;
          const data = hourlyData.get(key);
          if (data) data.leitura++;
        }
        
        if (message.data_resposta) {
          const hour = new Date(message.data_resposta).getHours();
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
        sentMessages,
        deliveredMessages,
        readMessages,
        responseMessages,
        queuedMessages,
        errorMessages,
        deliveryRate,
        readRate,
        responseRate,
        progressRate,
        hourlyActivity,
        statusDistribution,
        sentimentAnalysis: {
          superEngajado: sentimentCounts[SENTIMENT_VALUES.SUPER_ENGAJADO],
          positivo: sentimentCounts[SENTIMENT_VALUES.POSITIVO],
          neutro: sentimentCounts[SENTIMENT_VALUES.NEUTRO],
          negativo: sentimentCounts[SENTIMENT_VALUES.NEGATIVO],
          semClassificacao: sentimentCounts.sem_classificacao,
          distribution: sentimentDistribution
        },
        profileAnalysis: {
          distribution: profileDistribution
        }
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
