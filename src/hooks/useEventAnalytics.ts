import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeSentiment, SENTIMENT_VALUES } from '@/lib/sentiment';
import { statusColors, generateProfileColors } from '@/lib/colorUtils';

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
    enviados: number;
    respondidos: number;
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

export const useEventAnalytics = (eventId?: string, selectedDate?: Date) => {
  const { organization } = useAuth();

  const eventAnalyticsQuery = useQuery({
    queryKey: ['event-analytics', organization?.id, eventId, selectedDate],
    queryFn: async (): Promise<EventAnalytics> => {
      if (!organization?.id) {
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

      // Apply date filter if selectedDate is provided
      const applyDateFilter = (query: any, dateField: string = 'data_envio') => {
        let filteredQuery = query;
        if (selectedDate) {
          const startOfDay = new Date(selectedDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(selectedDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          filteredQuery = filteredQuery
            .gte(dateField, startOfDay.toISOString())
            .lte(dateField, endOfDay.toISOString());
        }
        return filteredQuery;
      };

      // Valid statuses for consistent filtering
      const validStatuses = ['fila', 'enviado', 'entregue', 'lido', 'respondido', 'erro', 'pendente'];
      
      // Common filters for all queries
      const commonFilters = (q: any) => applyDateFilter(q
        .eq('organization_id', organization.id)
        .eq('id_campanha', eventId || ''));

      // Fetch data for detailed analytics (paginated to handle large datasets)
      // Apply the same date filter as used in server counts
      const batchSize = 1000;
      let allMessagesData: any[] = [];
      let from = 0;
      let hasMore = true;

      // First try mensagens_enviadas table with date filter
      while (hasMore) {
        const { data: batch, error } = await applyDateFilter(
          supabase
            .from('mensagens_enviadas')
            .select('celular, data_envio, data_leitura, data_resposta, sentimento, status, perfil_contato')
            .eq('organization_id', organization.id)
            .eq('id_campanha', eventId || '')
        )
          .range(from, from + batchSize - 1);

        if (error) {
          console.error('Error fetching messages batch:', error);
          break;
        }

        if (batch && batch.length > 0) {
          allMessagesData = [...allMessagesData, ...batch];
          from += batchSize;
          hasMore = batch.length === batchSize;
        } else {
          hasMore = false;  
        }
      }

      // If no messages from mensagens_enviadas, try event_messages
      if (allMessagesData.length === 0) {
        let eventMessages: any[] = [];
        from = 0;
        hasMore = true;

        while (hasMore) {
          const { data: batch, error: eventError } = await applyDateFilter(
            supabase
              .from('event_messages')
              .select('contact_phone, sent_at, read_at, responded_at, sentiment, status, contact_name')
              .eq('event_id', eventId || '')
              .eq('organization_id', organization.id)
              .in('status', validStatuses), 'sent_at'
          )
            .range(from, from + batchSize - 1);

          if (eventError) {
            console.error('Error fetching event messages batch:', eventError);
            break;
          }

          if (batch && batch.length > 0) {
            eventMessages = [...eventMessages, ...batch];
            from += batchSize;
            hasMore = batch.length === batchSize;
          } else {
            hasMore = false;
          }
        }

        allMessagesData = eventMessages.map(msg => ({
          celular: msg.contact_phone,
          data_envio: msg.sent_at,
          data_leitura: msg.read_at,
          data_resposta: msg.responded_at,
          sentimento: msg.sentiment,
          status: msg.status,
          perfil_contato: msg.contact_name || 'Desconhecido'
        }));
      }

      console.log('Analytics data source with date filter:', allMessagesData.length);

      // Normalizar status
      const normalizeStatus = (status: string): string => {
        const statusMapping: Record<string, string> = {
          'fila': 'fila',
          'queued': 'fila',
          'pendente': 'fila',
          'processando': 'fila',
          'pending': 'fila',
          'processing': 'fila',
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

      const normalizedMessages = (allMessagesData || []).map(msg => ({
        ...msg,
        status: normalizeStatus(msg.status),
        sentiment: msg.sentimento,
        sent_at: msg.data_envio,
        read_at: msg.data_leitura,
        responded_at: msg.data_resposta
      }));

      // Defaults from the loaded page (no pagination limit)
      let totalMessages = normalizedMessages.length;
      let queuedMessages = normalizedMessages.filter(m => m.status === 'fila').length;
      let readMessages = normalizedMessages.filter(m => m.status === 'lido').length;
      // Improved response counting: status 'respondido' OR data_resposta/responded_at exists
      let responseMessages = normalizedMessages.filter(m => 
        m.status === 'respondido' || m.responded_at != null || m.data_resposta != null
      ).length;
      let errorMessages = normalizedMessages.filter(m => m.status === 'erro').length;
      // Enviados: "enviado" + "erro" statuses
      let deliveredMessages = normalizedMessages.filter(m => m.status === 'enviado').length;
      let sentMessages = deliveredMessages + errorMessages;

      // Always use exact server-side counts to avoid pagination limits
      try {
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

        // Use exact counts from server if data exists
        if ((totalRes.count ?? 0) > 0) {
          totalMessages = totalRes.count || 0;
          queuedMessages = queuedRes.count || 0;
          readMessages = readRes.count || 0;
          responseMessages = respondedRes.count || 0;
          errorMessages = errorRes.count || 0;
          deliveredMessages = deliveredRes.count || 0;
          sentMessages = deliveredMessages + errorMessages;
        } else {
          // Fallback to event_messages if mensagens_enviadas has no records
          const emFilters = (q: any) => applyDateFilter(q
            .eq('organization_id', organization.id)
            .eq('event_id', eventId || ''), 'sent_at');

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
      const progressMessages = totalMessages - queuedMessages;
      const progressRate = totalMessages > 0 ? (progressMessages / totalMessages) * 100 : 0;

      const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
      const readRate = deliveredMessages > 0 ? (readMessages / deliveredMessages) * 100 : 0;
      // Improved response rate: fallback to total if no reads
      const responseRate = readMessages > 0 ? (responseMessages / readMessages) * 100 : 
                          (totalMessages > 0 ? (responseMessages / totalMessages) * 100 : 0);
      
      // Log analytics for debugging
      console.log('Analytics calculated (server-accurate counts):', {
        totalMessages, queuedMessages, deliveredMessages, readMessages, 
        responseMessages, errorMessages, deliveryRate, readRate, responseRate, progressRate
      });

      // Process hourly activity - format for new chart (enviados, respondidos)
      const hourlyDataNew: Record<string, { enviados: number; respondidos: number }> = {};
      
      normalizedMessages?.forEach(message => {
        if (message.data_envio) {
          const hour = new Date(message.data_envio).getHours();
          const hourKey = `${hour.toString().padStart(2, '0')}:00`;
          
          if (!hourlyDataNew[hourKey]) {
            hourlyDataNew[hourKey] = { enviados: 0, respondidos: 0 };
          }
          
          hourlyDataNew[hourKey].enviados++;
          
          if (message.data_resposta) {
            hourlyDataNew[hourKey].respondidos++;
          }
        }
      });

      const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
        const hour = `${i.toString().padStart(2, '0')}:00`;
        return {
          hour,
          enviados: hourlyDataNew[hour]?.enviados || 0,
          respondidos: hourlyDataNew[hour]?.respondidos || 0,
        };
      });

      // Análise de sentimento incluindo NULL
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
          color: '#EF4444',
          emoji: '😞'
        },
        {
          sentiment: 'Sem Classificação',
          count: sentimentCounts.sem_classificacao,
          percentage: sentimentTotal > 0 ? (sentimentCounts.sem_classificacao / sentimentTotal) * 100 : 0,
          color: '#D1D5DB',
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
      const profileList = Object.keys(profileCounts);
      const profileColorMap = generateProfileColors(profileList);
      
      const profileDistribution = Object.entries(profileCounts).map(([profile, count]) => ({
        profile,
        count,
        percentage: profileTotal > 0 ? (count / profileTotal) * 100 : 0,
        color: profileColorMap[profile]
      }));

      // Distribuição por status
      const statusCounts = new Map();
      normalizedMessages?.forEach(message => {
        const status = message.status || 'fila';
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      });

      const statusDistribution = Array.from(statusCounts.entries()).map(([status, count]) => ({
        status,
        count,
        color: statusColors[status] || '#9CA3AF'
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