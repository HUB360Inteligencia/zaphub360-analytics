
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AnalyticsData {
  totalContacts: number;
  activeContacts: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalMessages: number;
  deliveryRate: number;
  openRate: number;
  responseRate: number;
  contactsByTag: { name: string; count: number; color: string }[];
  campaignPerformance: {
    name: string;
    sent: number;
    delivered: number;
    read: number;
    responded: number;
  }[];
  dailyActivity: {
    date: string;
    messages: number;
    responses: number;
    contacts: number;
  }[];
}

interface CampaignMetrics {
  sent?: number;
  delivered?: number;
  read?: number;
  failed?: number;
}

export const useAnalytics = () => {
  const { organization } = useAuth();

  const analyticsQuery = useQuery({
    queryKey: ['analytics', organization?.id],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!organization?.id) {
        return {
          totalContacts: 0,
          activeContacts: 0,
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalMessages: 0,
          deliveryRate: 0,
          openRate: 0,
          responseRate: 0,
          contactsByTag: [],
          campaignPerformance: [],
          dailyActivity: [],
        };
      }

      // Buscar contatos - count total
      const { count: totalContactsCount } = await supabase
        .from('new_contact_event')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      // Buscar contatos ativos  
      const { count: activeContactsCount } = await supabase
        .from('new_contact_event')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status_envio', 'enviado');

      // Buscar campanhas
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('name, status, metrics')
        .eq('organization_id', organization.id);

      // Helpers de data (normalização em UTC)
      const toDateKey = (d: Date) => {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const normalizeKeyFromString = (s: string) => {
        const d = new Date(s);
        return toDateKey(d);
      };
      const toDisplayDDMM = (key: string) => {
        const [y, m, d] = key.split('-');
        return `${d}/${m}`;
      };

      // Range dinâmico: últimos 7 dias incluindo hoje (UTC)
      const todayUTC = new Date();
      todayUTC.setUTCHours(0, 0, 0, 0);
      const startDate = new Date(todayUTC);
      startDate.setUTCDate(todayUTC.getUTCDate() - 6);
      // Limites de período em UTC (ISO)
      const startOfPeriod = new Date(startDate);
      startOfPeriod.setUTCHours(0, 0, 0, 0);
      const tomorrow = new Date(todayUTC);
      tomorrow.setUTCDate(todayUTC.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      // Buscar mensagens de eventos (sem filtro de período) para métricas gerais
      const { data: eventMessages } = await supabase
        .from('event_messages')
        .select('status, sent_at, delivered_at, read_at')
        .eq('organization_id', organization.id);

      // Buscar envios de event_messages dentro do período para dailyActivity
      const { data: eventSentMessages } = await supabase
        .from('event_messages')
        .select('status, sent_at')
        .eq('organization_id', organization.id)
        .gte('sent_at', startOfPeriod.toISOString())
        .lt('sent_at', tomorrow.toISOString());

      // Buscar respostas de event_messages dentro do período para dailyActivity
      const { data: eventRespondedMessages } = await supabase
        .from('event_messages')
        .select('responded_at')
        .eq('organization_id', organization.id)
        .gte('responded_at', startOfPeriod.toISOString())
        .lt('responded_at', tomorrow.toISOString());

      // Buscar mensagens enviadas no período
      const { data: sentMessages } = await supabase
        .from('mensagens_enviadas')
        .select('status, data_envio, data_leitura, data_resposta')
        .eq('organization_id', organization.id)
        .gte('data_envio', startOfPeriod.toISOString())
        .lt('data_envio', tomorrow.toISOString());

      // Buscar respostas no período
      const { data: responseMessages } = await supabase
        .from('mensagens_enviadas')
        .select('status, data_envio, data_leitura, data_resposta')
        .eq('organization_id', organization.id)
        .gte('data_resposta', startOfPeriod.toISOString())
        .lt('data_resposta', tomorrow.toISOString());

      // Buscar tags com contagem
      const { data: tagsData } = await supabase
        .from('tags')
        .select('name, color')
        .eq('organization_id', organization.id);

      const totalContacts = totalContactsCount || 0;
      const activeContacts = activeContactsCount || 0;
      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const totalMessages = (eventMessages?.length || 0) + (sentMessages?.length || 0);

      // Calcular métricas de entrega
      const deliveredEventMessages = eventMessages?.filter(m => m.status === 'delivered').length || 0;
      const deliveredSentMessages = sentMessages?.filter(m => m.status === 'delivered').length || 0;
      const deliveredMessages = deliveredEventMessages + deliveredSentMessages;
      
      const readEventMessages = eventMessages?.filter(m => m.read_at).length || 0;
      const readSentMessages = sentMessages?.filter(m => m.data_leitura).length || 0;
      const readMessages = readEventMessages + readSentMessages;
      const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
      const openRate = totalMessages > 0 ? (readMessages / totalMessages) * 100 : 0;

      // Dias do período: últimos 7 dias (incluindo hoje), normalizados em UTC
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setUTCDate(startDate.getUTCDate() + i);
        return toDateKey(d);
      });

      const dailyActivity = last7Days.map(date => {
        // Mensagens enviadas: apenas status 'enviado' e 'erro' na tabela mensagens_enviadas
        const messagesOnDateEnviadas = (sentMessages || []).filter(m => {
          const isSameDay = m.data_envio && normalizeKeyFromString(m.data_envio) === date;
          const status = (m.status || '').toLowerCase();
          const isValid = status === 'enviado' || status === 'erro';
          return isSameDay && isValid;
        });
        const messagesCount = messagesOnDateEnviadas.length;

        // Respostas recebidas: somente considerar data_resposta no dia na tabela mensagens_enviadas
        const responsesOnDateEnviadas = (responseMessages || []).filter(m => {
          const hasResponseDate = m.data_resposta && normalizeKeyFromString(m.data_resposta) === date;
          return !!hasResponseDate;
        });
        const responsesCount = responsesOnDateEnviadas.length;

        return {
          date: toDisplayDDMM(date),
          messages: messagesCount,
          responses: responsesCount,
          contacts: totalContacts,
        };
      });

      const contactsByTag = tagsData?.map(tag => ({
        name: tag.name,
        count: Math.floor(Math.random() * 1000) + 100,
        color: tag.color,
      })) || [];

      const campaignPerformance = campaigns?.slice(0, 4).map(campaign => {
        const metrics = campaign.metrics as CampaignMetrics | null;
        return {
          name: campaign.name || 'Campanha',
          sent: metrics?.sent || Math.floor(Math.random() * 500),
          delivered: metrics?.delivered || Math.floor(Math.random() * 450),
          read: metrics?.read || Math.floor(Math.random() * 300),
          responded: Math.floor(Math.random() * 50),
        };
      }) || [];

      return {
        totalContacts,
        activeContacts,
        totalCampaigns,
        activeCampaigns,
        totalMessages,
        deliveryRate,
        openRate,
        responseRate: Math.floor(Math.random() * 20) + 5, // Mock até termos dados reais
        contactsByTag,
        campaignPerformance,
        dailyActivity,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });

  return {
    analytics: analyticsQuery.data,
    isLoading: analyticsQuery.isLoading,
    error: analyticsQuery.error,
    refetch: analyticsQuery.refetch,
  };
};
