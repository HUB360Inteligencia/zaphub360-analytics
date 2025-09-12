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
    messages: number;
    delivered: number;
    read: number;
    responded: number;
    envio: number;
    leitura: number;
    resposta: number;
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

export const useEventAnalytics = (eventId?: string) => {
  const { organization } = useAuth();

  const eventAnalyticsQuery = useQuery({
    queryKey: ['event-analytics', organization?.id, eventId],
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

      // Try multiple data sources (unified fallback logic)
      let messages: any[] = [];
      
      // First try mensagens_enviadas table
      const { data: messages1, error: messagesError1 } = await supabase
        .from('mensagens_enviadas')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('id_campanha', eventId || '');

      if (messages1 && messages1.length > 0) {
        messages = messages1;
        console.log('Analytics data source: mensagens_enviadas:', messages1.length);
      } else {
        // Try event_messages table if no messages in mensagens_enviadas
        const { data: messages2, error: messagesError2 } = await supabase
          .from('event_messages')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('event_id', eventId || '');

        if (messages2 && messages2.length > 0) {
          messages = messages2.map(msg => ({
            ...msg,
            status: msg.status,
            sentimento: msg.sentiment,
            data_envio: msg.sent_at,
            data_leitura: msg.read_at,
            data_resposta: msg.responded_at,
            perfil_contato: null // event_messages doesn't have contact_profile field
          }));
          console.log('Analytics data source: event_messages:', messages2.length);
        } else {
          // Last resort: try new_contact_event table
          const { data: contacts, error: contactsError } = await supabase
            .from('new_contact_event')
            .select('*')
            .eq('organization_id', organization.id)
            .eq('event_id', parseInt(eventId || '0'));

          if (contacts && contacts.length > 0) {
            messages = contacts.map(contact => ({
              status: contact.status_envio || 'fila',
              sentimento: contact.sentimento,
              data_envio: null,
              data_leitura: null,
              data_resposta: null,
              perfil_contato: null
            }));
            console.log('Analytics data source: new_contact_event:', contacts.length);
          }
        }
      }

      if (messages.length === 0) {
        console.log('No messages found in any table for event:', eventId);
      }

      // Normalizar status
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

      // Defaults from the loaded page (may be limited to 1000 by PostgREST)
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

      // Try to override counts with exact server-side counts (no 1000 cap)
      try {
        const commonFilters = (q: any) => q
          .eq('organization_id', organization.id)
          .eq('id_campanha', eventId || '');

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
          // Fallback to event_messages if mensagens_enviadas has no records
          const emFilters = (q: any) => q
            .eq('organization_id', organization.id)
            .eq('event_id', eventId || '');

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
        responded: data.resposta,
        envio: data.envio,
        leitura: data.leitura,
        resposta: data.resposta
      })).sort((a, b) => a.hour.localeCompare(b.hour));

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
