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

// Helper function to get date range based on timeRange
const getDateRange = (timeRange: TimeRange): { startDate: string | null; endDate: string | null } => {
  if (timeRange === 'all') {
    return { startDate: null, endDate: null };
  }
  
  const now = new Date();
  const startDate = new Date();
  
  switch (timeRange) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
  }
  
  return { startDate: startDate.toISOString(), endDate: now.toISOString() };
};

// Fetch total contacts
const fetchTotalContacts = async (orgId: string) => {
  const { count } = await supabase
    .from('new_contact_event')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);
  
  return count || 0;
};

// Fetch sentiment data using server-side aggregation
const fetchSentimentData = async (orgId: string) => {
  const { data: sentiments, error } = await supabase
    .rpc('get_sentiment_distribution', { p_organization_id: orgId });

  if (error) {
    console.error('[Analytics] Error fetching sentiment distribution:', error);
    return { distribution: [], totalClassified: 0 };
  }

  console.log(`[Analytics] Fetched sentiment distribution from server:`, sentiments);

  if (!sentiments || sentiments.length === 0) {
    return { distribution: [], totalClassified: 0 };
  }

  // Normalize sentiments and calculate total
  const normalizedData: Record<string, number> = {};
  
  sentiments.forEach(({ sentiment, count }: { sentiment: string; count: number }) => {
    const normalized = normalizeSentiment(sentiment);
    if (normalized) {
      normalizedData[normalized] = (normalizedData[normalized] || 0) + Number(count);
    }
  });

  const total = Object.values(normalizedData).reduce((sum, count) => sum + count, 0);

  // Map to distribution format
  const distribution = Object.entries(normalizedData).map(([sentiment, count]) => {
    const option = SENTIMENT_VALUES;
    let color = '#6B7280'; // default gray
    
    if (sentiment === option.SUPER_ENGAJADO) color = '#ff6b35';
    else if (sentiment === option.POSITIVO) color = '#10b981';
    else if (sentiment === option.NEUTRO) color = '#6b7280';
    else if (sentiment === option.NEGATIVO) color = '#ef4444';

    return {
      sentiment,
      count,
      percentage: Math.round((count / total) * 100),
      color
    };
  });

  return {
    distribution,
    totalClassified: total
  };
};

// Fetch messages data using server-side counting
const fetchMessagesData = async (orgId: string, startDate: string | null, endDate: string | null) => {
  // Build base queries with count
  let totalQuery = supabase
    .from('mensagens_enviadas')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  let deliveredQuery = supabase
    .from('mensagens_enviadas')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'enviado');

  let errorQuery = supabase
    .from('mensagens_enviadas')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'erro');

  let respondedQuery = supabase
    .from('mensagens_enviadas')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .not('data_resposta', 'is', null);

  // Apply date filter if provided
  if (startDate && endDate) {
    totalQuery = totalQuery.gte('data_envio', startDate).lte('data_envio', endDate);
    deliveredQuery = deliveredQuery.gte('data_envio', startDate).lte('data_envio', endDate);
    errorQuery = errorQuery.gte('data_envio', startDate).lte('data_envio', endDate);
    respondedQuery = respondedQuery.gte('data_envio', startDate).lte('data_envio', endDate);
  }

  // Execute all counts in parallel
  const [totalResult, deliveredResult, errorResult, respondedResult] = await Promise.all([
    totalQuery,
    deliveredQuery,
    errorQuery,
    respondedQuery
  ]);

  const totalMessages = totalResult.count || 0;
  const deliveredMessagesCount = deliveredResult.count || 0;
  const errorMessagesCount = errorResult.count || 0;
  const respondedMessagesCount = respondedResult.count || 0;

  console.log(`[Analytics] Messages counts: ${totalMessages} total, ${deliveredMessagesCount} delivered, ${errorMessagesCount} errors, ${respondedMessagesCount} responded`);

  const deliveryRate = totalMessages > 0 ? Math.round((deliveredMessagesCount / totalMessages) * 100) : 0;
  const responseRate = deliveredMessagesCount > 0 ? Math.round((respondedMessagesCount / deliveredMessagesCount) * 100) : 0;

  return {
    totalMessages,
    deliveredMessagesCount,
    errorMessagesCount,
    respondedMessagesCount,
    deliveryRate,
    responseRate,
    responsesCount: respondedMessagesCount
  };
};

// Fetch profiles data using server-side aggregation
const fetchProfilesData = async (orgId: string) => {
  const { data: profiles, error } = await supabase
    .rpc('get_profile_distribution', { p_organization_id: orgId });

  if (error) {
    console.error('[Analytics] Error fetching profile distribution:', error);
    return [];
  }

  console.log(`[Analytics] Fetched ${profiles?.length || 0} profile types from server`);

  if (!profiles || profiles.length === 0) {
    return [];
  }

  const profileData = profiles.map((p: { profile: string; count: number }) => ({
    profile: p.profile,
    count: Number(p.count)
  }));

  const total = profileData.reduce((sum, item) => sum + item.count, 0);
  const profileList = profileData.map(p => p.profile);
  const colorMap = generateProfileColors(profileList);

  return profileData.map(({ profile, count }) => ({
    profile,
    count,
    percentage: Math.round((count / total) * 100),
    color: colorMap[profile]
  }));
};

// Fetch daily activity
const fetchDailyActivity = async (orgId: string, startDate: string | null, endDate: string | null) => {
  let query = supabase
    .from('mensagens_enviadas')
    .select('data_envio, data_resposta')
    .eq('organization_id', orgId)
    .not('data_envio', 'is', null)
    .order('data_envio', { ascending: true });
  
  // Apply date filter ONLY if startDate and endDate exist
  if (startDate && endDate) {
    query = query
      .gte('data_envio', startDate)
      .lte('data_envio', endDate);
  }
  
  // Apply range AFTER filters
  const { data: messages } = await query.range(0, 49999);
  
  if (!messages || messages.length === 0) {
    return [];
  }

  console.log(`[Analytics] Fetched ${messages.length} messages for daily activity`);

  // Group by date
  const dailyData: Record<string, { messages: number; responses: number; contacts: Set<string> }> = {};
  
  messages.forEach(({ data_envio, data_resposta }) => {
    if (!data_envio) return;
    
    const date = new Date(data_envio).toLocaleDateString('pt-BR');
    
    if (!dailyData[date]) {
      dailyData[date] = { messages: 0, responses: 0, contacts: new Set() };
    }
    
    dailyData[date].messages += 1;
    if (data_resposta) {
      dailyData[date].responses += 1;
    }
  });

  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      messages: data.messages,
      responses: data.responses,
      contacts: data.contacts.size
    }))
    .sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('/').map(Number);
      const [dayB, monthB, yearB] = b.date.split('/').map(Number);
      return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
    });
};

// Fetch campaign performance
const fetchCampaignPerformance = async (orgId: string) => {
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (!campaigns || campaigns.length === 0) {
    return [];
  }

  const performance = await Promise.all(
    campaigns.map(async (campaign) => {
      const { data: messages } = await supabase
        .from('mensagens_enviadas')
        .select('status, data_resposta')
        .eq('id_campanha', campaign.id)
        .range(0, 49999);
      
      console.log(`[Analytics] Campaign ${campaign.name}: ${messages?.length || 0} messages`);
      
      const sent = messages?.length || 0;
      const delivered = messages?.filter(m => m.status === 'enviado').length || 0;
      const errors = messages?.filter(m => m.status === 'erro').length || 0;
      const responded = messages?.filter(m => m.data_resposta !== null).length || 0;

      return {
        name: campaign.name,
        sent,
        delivered,
        read: 0, // Not tracked
        responded,
        errors
      };
    })
  );

  return performance;
};

export const useAnalytics = (timeRange: TimeRange = '30d') => {
  const { organization } = useAuth();

  const analyticsQuery = useQuery({
    queryKey: ['analytics-v2', organization?.id, timeRange],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!organization?.id) {
        return emptyAnalyticsData;
      }

      try {
        const { startDate, endDate } = getDateRange(timeRange);

        // Fetch all data in parallel
        const [
          totalContacts,
          globalSentiment,
          messagesData,
          contactsByProfile,
          dailyActivity,
          campaignPerformance
        ] = await Promise.all([
          fetchTotalContacts(organization.id),
          fetchSentimentData(organization.id),
          fetchMessagesData(organization.id, startDate, endDate),
          fetchProfilesData(organization.id),
          fetchDailyActivity(organization.id, startDate, endDate),
          fetchCampaignPerformance(organization.id)
        ]);

        // Get campaign counts
        const { count: totalCampaigns } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id);

        const { count: activeCampaigns } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('status', 'active');

        return {
          totalContacts,
          totalCampaigns: totalCampaigns || 0,
          activeCampaigns: activeCampaigns || 0,
          totalMessages: messagesData.totalMessages,
          deliveredMessagesCount: messagesData.deliveredMessagesCount,
          errorMessagesCount: messagesData.errorMessagesCount,
          respondedMessagesCount: messagesData.respondedMessagesCount,
          deliveryRate: messagesData.deliveryRate,
          openRate: 0, // Not tracked
          responseRate: messagesData.responseRate,
          contactsByTag: [], // Not available in current schema
          contactsByProfile,
          campaignPerformance,
          templatePerformance: [], // Not available
          dailyActivity,
          hourlyActivity: [], // Can implement if needed
          globalSentiment,
          sentProcessedCount: globalSentiment.totalClassified,
          responsesCount: messagesData.responsesCount,
          sentimentTrend: [], // Requires temporal aggregation
          geographicData: [], // Can implement if needed
          profileAnalysis: [], // Requires complex joins
          previousPeriod: {
            totalMessages: 0,
            deliveredMessagesCount: 0,
            respondedMessagesCount: 0,
            deliveryRate: 0,
            openRate: 0,
            responseRate: 0,
          }
        };
      } catch (error) {
        console.error('Error fetching analytics:', error);
        return emptyAnalyticsData;
      }
    },
    enabled: !!organization?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  return {
    analytics: analyticsQuery.data,
    isLoading: analyticsQuery.isLoading,
    error: analyticsQuery.error,
  };
};
