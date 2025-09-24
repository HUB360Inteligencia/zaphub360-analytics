import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeSentiment, SENTIMENT_VALUES } from '@/lib/sentiment';
import { format } from 'date-fns';

export interface CampaignAnalytics {
  hourlyActivity: Array<{
    hour: string;
    enviados: number;
    respondidos: number;
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
}

export const useCampaignAnalytics = (campaignId?: string, selectedDate?: Date) => {
  const { organization } = useAuth();

  const campaignAnalyticsQuery = useQuery({
    queryKey: ['campaign-analytics', organization?.id, campaignId, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'all'],
    queryFn: async (): Promise<CampaignAnalytics> => {
      if (!organization?.id || !campaignId) {
        return {
          hourlyActivity: [],
          sentimentAnalysis: {
            superEngajado: 0,
            positivo: 0,
            neutro: 0,
            negativo: 0,
            semClassificacao: 0,
            distribution: []
          }
        };
      }

      // Fetch all campaign messages with pagination to handle large datasets
      const pageSize = 2000; // Increased from 1000
      let from = 0;
      let to = pageSize - 1;
      let allMessages: any[] = [];

      while (true) {
        let query = supabase
          .from('mensagens_enviadas')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('id_campanha', campaignId)
          .range(from, to);

        // Apply date filter if selected
        if (selectedDate) {
          const startOfDay = new Date(selectedDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(selectedDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          query = query
            .gte('data_envio', startOfDay.toISOString())
            .lte('data_envio', endOfDay.toISOString());
        }

        const { data: page, error: messagesError } = await query;

        if (messagesError) {
          console.error('Error fetching campaign messages:', messagesError);
          throw messagesError;
        }

        if (!page || page.length === 0) break;

        allMessages = allMessages.concat(page);

        if (page.length < pageSize) break; // última página
        from += pageSize;
        to += pageSize;
      }

      const messages = allMessages;

      // Initialize hourly data
      const hourlyData = new Map();
      for (let i = 0; i < 24; i++) {
        const hour = `${i.toString().padStart(2, '0')}:00`;
        hourlyData.set(hour, { enviados: 0, respondidos: 0 });
      }

      // Process hourly activity
      messages?.forEach(message => {
        if (!message.data_envio) return;
        
        const hour = new Date(message.data_envio).getHours();
        const key = `${hour.toString().padStart(2, '0')}:00`;
        const data = hourlyData.get(key);
        if (!data) return;
        
        // Enviados: todas as mensagens que tentaram ser enviadas (exceto pendente/fila)
        if (!['pendente', 'fila'].includes(message.status)) {
          data.enviados++;
        }
        
        // Respondidos: mensagens que têm data_resposta (baseado no horário de envio)
        if (message.data_resposta) {
          data.respondidos++;
        }
      });

      const hourlyActivity = Array.from(hourlyData.entries()).map(([hour, data]) => ({
        hour,
        enviados: data.enviados,
        respondidos: data.respondidos
      })).sort((a, b) => a.hour.localeCompare(b.hour));

      // Calculate sentiment analysis
      const sentimentCounts = {
        [SENTIMENT_VALUES.SUPER_ENGAJADO]: messages?.filter(m => normalizeSentiment(m.sentimento) === SENTIMENT_VALUES.SUPER_ENGAJADO).length || 0,
        [SENTIMENT_VALUES.POSITIVO]: messages?.filter(m => normalizeSentiment(m.sentimento) === SENTIMENT_VALUES.POSITIVO).length || 0,
        [SENTIMENT_VALUES.NEUTRO]: messages?.filter(m => normalizeSentiment(m.sentimento) === SENTIMENT_VALUES.NEUTRO).length || 0,
        [SENTIMENT_VALUES.NEGATIVO]: messages?.filter(m => normalizeSentiment(m.sentimento) === SENTIMENT_VALUES.NEGATIVO).length || 0,
        sem_classificacao: messages?.filter(m => m.sentimento === null || m.sentimento === undefined).length || 0,
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

      return {
        hourlyActivity,
        sentimentAnalysis: {
          superEngajado: sentimentCounts[SENTIMENT_VALUES.SUPER_ENGAJADO],
          positivo: sentimentCounts[SENTIMENT_VALUES.POSITIVO],
          neutro: sentimentCounts[SENTIMENT_VALUES.NEUTRO],
          negativo: sentimentCounts[SENTIMENT_VALUES.NEGATIVO],
          semClassificacao: sentimentCounts.sem_classificacao,
          distribution: sentimentDistribution
        }
      };
    },
    enabled: !!organization?.id && !!campaignId,
    staleTime: 0,
    refetchInterval: 30000,
  });

  return {
    analytics: campaignAnalyticsQuery.data,
    isLoading: campaignAnalyticsQuery.isLoading,
    error: campaignAnalyticsQuery.error,
    refetch: campaignAnalyticsQuery.refetch,
  };
};