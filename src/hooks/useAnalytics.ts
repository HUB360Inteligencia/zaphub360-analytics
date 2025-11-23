import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeSentiment, SENTIMENT_VALUES } from '@/lib/sentiment';
import { generateProfileColors } from '@/lib/colorUtils';

export interface AnalyticsData {
  totalContacts: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalMessages: number;
  deliveredMessagesCount: number;
  errorMessagesCount: number;
  respondedMessagesCount: number;
  deliveryRate: number;
  openRate: number;
  responseRate: number;
  contactsByTag: { name: string; count: number; color: string; engagementRate: number }[];
  contactsByProfile: { profile: string; count: number; percentage: number; color: string }[];
  campaignPerformance: {
    name: string;
    sent: number;
    delivered: number;
    read: number;
    responded: number;
    errors: number;
  }[];
  templatePerformance: {
    templateId: string;
    sent: number;
    read: number;
    responded: number;
    openRate: number;
    responseRate: number;
  }[];
  dailyActivity: {
    date: string;
    messages: number;
    responses: number;
    contacts: number;
  }[];
  hourlyActivity: {
    hour: string;
    messages: number;
    responses: number;
  }[];
  globalSentiment: {
    distribution: { sentiment: string; count: number; percentage: number; color: string }[];
    totalClassified: number;
  };
  sentProcessedCount: number;
  responsesCount: number;
  previousPeriod: {
    totalMessages: number;
    deliveredMessagesCount: number;
    respondedMessagesCount: number;
    deliveryRate: number;
    openRate: number;
    responseRate: number;
  };
  sentimentTrend: {
    date: string;
    super_engajado: number;
    positivo: number;
    neutro: number;
    negativo: number;
  }[];
  geographicData: {
    cidade: string;
    total_contatos: number;
    mensagens_enviadas: number;
    mensagens_respondidas: number;
    taxa_resposta: number;
    sentimento_predominante: string;
  }[];
  profileAnalysis: {
    profile: string;
    total_contatos: number;
    mensagens_enviadas: number;
    mensagens_respondidas: number;
    taxa_resposta: number;
    tempo_medio_resposta?: number;
    melhor_horario?: string;
    color: string;
  }[];
}

export type TimeRange = '7d' | '30d' | '90d' | 'all';

const emptyAnalyticsData: AnalyticsData = {
  totalContacts: 0,
  totalCampaigns: 0,
  activeCampaigns: 0,
  totalMessages: 0,
  deliveredMessagesCount: 0,
  errorMessagesCount: 0,
  respondedMessagesCount: 0,
  deliveryRate: 0,
  openRate: 0,
  responseRate: 0,
  contactsByTag: [],
  contactsByProfile: [],
  campaignPerformance: [],
  templatePerformance: [],
  dailyActivity: [],
  hourlyActivity: [],
  globalSentiment: { distribution: [], totalClassified: 0 },
  sentProcessedCount: 0,
  responsesCount: 0,
  sentimentTrend: [],
  geographicData: [],
  profileAnalysis: [],
  previousPeriod: {
    totalMessages: 0,
    deliveredMessagesCount: 0,
    respondedMessagesCount: 0,
    deliveryRate: 0,
    openRate: 0,
    responseRate: 0,
  }
};

export const useAnalytics = (timeRange: TimeRange = '30d') => {
  const { organization } = useAuth();

  const analyticsQuery = useQuery({
    queryKey: ['analytics', organization?.id, timeRange],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!organization?.id) {
        return emptyAnalyticsData;
      }

      // TODO: Implement full analytics logic
      // For now, return empty data to prevent build errors
      return emptyAnalyticsData;
    },
    enabled: !!organization?.id,
  });

  return {
    analytics: analyticsQuery.data,
    isLoading: analyticsQuery.isLoading,
    error: analyticsQuery.error,
  };
};
