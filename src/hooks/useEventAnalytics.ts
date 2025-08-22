import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EventAnalytics {
  totalMessages: number;
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

      // Buscar dados das mensagens do evento da tabela mensagens_enviadas
      let messagesQuery = supabase
        .from('mensagens_enviadas')
        .select('*')
        .eq('organization_id', organization.id);

      if (eventId) {
        messagesQuery = messagesQuery.eq('id_campanha', eventId);
      }

      const { data: messages, error } = await messagesQuery;

      if (error) {
        console.error('Error fetching event analytics:', error);
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
        status: normalizeStatus(msg.status),
        sentiment: msg.sentimento,
        sent_at: msg.data_envio,
        read_at: msg.data_leitura,
        responded_at: msg.data_resposta
      }));

      const totalMessages = normalizedMessages.length;
      const queuedMessages = normalizedMessages.filter(m => m.status === 'fila').length;
      const readMessages = normalizedMessages.filter(m => m.status === 'lido').length;
      const responseMessages = normalizedMessages.filter(m => m.responded_at != null).length;
      const errorMessages = normalizedMessages.filter(m => m.status === 'erro').length;
      
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

      // Análise de sentimento incluindo NULL
      const sentimentCounts = {
        super_engajado: normalizedMessages.filter(m => m.sentiment === 'super_engajado').length,
        positivo: normalizedMessages.filter(m => m.sentiment === 'positivo').length,
        neutro: normalizedMessages.filter(m => m.sentiment === 'neutro').length,
        negativo: normalizedMessages.filter(m => m.sentiment === 'negativo').length,
        sem_classificacao: normalizedMessages.filter(m => m.sentiment === null || m.sentiment === undefined).length,
      };

      const sentimentTotal = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);

      const sentimentDistribution = [
        {
          sentiment: 'Super Engajado',
          count: sentimentCounts.super_engajado,
          percentage: sentimentTotal > 0 ? (sentimentCounts.super_engajado / sentimentTotal) * 100 : 0,
          color: '#FF6B35',
          emoji: '🔥'
        },
        {
          sentiment: 'Positivo',
          count: sentimentCounts.positivo,
          percentage: sentimentTotal > 0 ? (sentimentCounts.positivo / sentimentTotal) * 100 : 0,
          color: '#10B981',
          emoji: '😊'
        },
        {
          sentiment: 'Neutro',
          count: sentimentCounts.neutro,
          percentage: sentimentTotal > 0 ? (sentimentCounts.neutro / sentimentTotal) * 100 : 0,
          color: '#6B7280',
          emoji: '😐'
        },
        {
          sentiment: 'Negativo',
          count: sentimentCounts.negativo,
          percentage: sentimentTotal > 0 ? (sentimentCounts.negativo / sentimentTotal) * 100 : 0,
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
        errorMessages,
        deliveryRate,
        readRate,
        responseRate,
        progressRate,
        hourlyActivity,
        statusDistribution,
        sentimentAnalysis: {
          superEngajado: sentimentCounts.super_engajado,
          positivo: sentimentCounts.positivo,
          neutro: sentimentCounts.neutro,
          negativo: sentimentCounts.negativo,
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
