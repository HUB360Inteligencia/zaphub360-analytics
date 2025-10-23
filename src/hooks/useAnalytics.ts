
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeSentiment, SENTIMENT_VALUES } from '@/lib/sentiment';
import { generateProfileColors } from '@/lib/colorUtils';

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
  contactsByProfile: { profile: string; count: number; percentage: number; color: string }[];
  campaignPerformance: {
    name: string;
    sent: number;
    delivered: number;
    read: number;
    responded: number;
    errors: number;
  }[];
  dailyActivity: {
    date: string;
    messages: number;
    responses: number;
    contacts: number;
  }[];
  globalSentiment: {
    distribution: { sentiment: string; count: number; percentage: number; color: string }[];
    totalClassified: number;
  };
  // Adicionado: contador usado como denominador da taxa de resposta
  sentProcessedCount: number;
  // Novo: total de respostas (data_resposta não nula) no histórico
  responsesCount: number;
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
          contactsByProfile: [],
          campaignPerformance: [],
          dailyActivity: [],
          globalSentiment: { distribution: [], totalClassified: 0 },
          // Adicionado: default
          sentProcessedCount: 0,
          // Novo: default
          responsesCount: 0,
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
        .select('id, name, status')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      // Helpers de data (usar horário local para refletir calendário real)
      const toDateKey = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const normalizeKeyFromString = (s: string) => {
        if (!s) return '';
        const str = s.trim();

        // 1) ISO-like prefix: YYYY-MM-DD or YYYY/MM/DD
        const isoMatch = str.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/);
        if (isoMatch) {
          // If separators were slashes, normalize to dashes
          return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
        }

        // 2) Brazilian/European format at start: DD/MM/YYYY or DD-MM-YYYY
        const brMatch = str.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/);
        if (brMatch) {
          return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
        }

        // 3) If a full datetime appears but with date first (YYYY-MM-DDTHH:mm...)
        const datePrefix = str.match(/^(\d{4}-\d{2}-\d{2})/);
        if (datePrefix) return datePrefix[1];

        // 4) Last resort: robust Date parse with timezone normalization
        let normalized = str;
        if (normalized.includes(' ') && !normalized.includes('T')) normalized = normalized.replace(' ', 'T');
        normalized = normalized.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
        normalized = normalized.replace(/([+-]\d{2})$/, '$1:00');
        let d = new Date(normalized);
        if (isNaN(d.getTime())) {
          // Attempt to parse "DD/MM/YYYY HH:mm" by swapping parts
          const alt = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
          if (alt) return `${alt[3]}-${alt[2]}-${alt[1]}`;
          // Remove trailing timezone / Z and parse again
          const noTz = normalized.replace(/([+-]\d{2}:?\d{2}|Z)$/i, '');
          d = new Date(noTz);
        }
        if (isNaN(d.getTime())) return '';
        return toDateKey(d);
      };
      const toDisplayDDMM = (key: string) => {
        if (!key) return '';
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
        .select('status, sent_at, delivered_at, read_at, responded_at')
        .eq('organization_id', organization.id);

      // Adicionar contagens globais para total de mensagens
      const { count: eventMessagesCount } = await supabase
        .from('event_messages')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id);
      const { count: sentMessagesGlobalCount } = await supabase
        .from('mensagens_enviadas')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      // Buscar mensagens enviadas (GLOBAL) para métricas gerais e dailyActivity
      const pageSize = 2000;
      let fromIdx = 0;
      let toIdx = pageSize - 1;
      let allSentMessages: any[] = [];
      
      while (true) {
        const { data: page } = await supabase
          .from('mensagens_enviadas')
          .select('id, status, data_envio, data_leitura, data_resposta')
          .eq('organization_id', organization.id)
          .range(fromIdx, toIdx);
        if (!page || page.length === 0) break;
        allSentMessages = allSentMessages.concat(page);
        if (page.length < pageSize) break;
        fromIdx += pageSize;
        toIdx += pageSize;
      }

      // Buscar tags com contagem
      const { data: tagsData } = await supabase
        .from('tags')
        .select('name, color')
        .eq('organization_id', organization.id);

      // Sentimento Global (contatos): paginar new_contact_event.sentimento e agrupar
      let sentimentCounts: Record<string, number> = {
        [SENTIMENT_VALUES.SUPER_ENGAJADO]: 0,
        [SENTIMENT_VALUES.POSITIVO]: 0,
        [SENTIMENT_VALUES.NEUTRO]: 0,
        [SENTIMENT_VALUES.NEGATIVO]: 0,
        sem_classificacao: 0,
      };
      let pageIndex = 0;
      const batchSize = 1000;
      while (true) {
        const from = pageIndex * batchSize;
        const to = from + batchSize - 1;
        const { data: pageData } = await supabase
          .from('new_contact_event')
          .select('sentimento, perfil')
          .eq('organization_id', organization.id)
          .range(from, to);
        if (!pageData || pageData.length === 0) break;
        for (const row of pageData) {
          const normalized = normalizeSentiment(row.sentimento ?? null);
          if (normalized) {
            sentimentCounts[normalized] = (sentimentCounts[normalized] || 0) + 1;
          } else {
            sentimentCounts.sem_classificacao = (sentimentCounts.sem_classificacao || 0) + 1;
          }
        }
        if (pageData.length < batchSize) break;
        pageIndex++;
      }

      // Distribuição por Perfil (new_contact_event.perfil_contato)
      const profileCounts: Record<string, number> = {};
      pageIndex = 0;
      while (true) {
        const from = pageIndex * batchSize;
        const to = from + batchSize - 1;
        const { data: pageData } = await supabase
          .from('new_contact_event')
          .select('perfil_contato')
          .eq('organization_id', organization.id)
          .not('perfil_contato', 'is', null)
          .neq('perfil_contato', '')
          .range(from, to);
        if (!pageData || pageData.length === 0) break;
        for (const row of pageData) {
          const raw = (row as any).perfil_contato as string | null;
          const profile = raw ? raw.trim() : '';
          if (!profile) continue; // ignore vazios/nulos
          profileCounts[profile] = (profileCounts[profile] || 0) + 1;
        }
        if (pageData.length < batchSize) break;
        pageIndex++;
      }

      const totalContacts = totalContactsCount || 0;
      const activeContacts = activeContactsCount || 0;
      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const totalMessages = (eventMessagesCount || 0) + (sentMessagesGlobalCount || 0);

      // Calcular métricas de entrega com contagem (apenas mensagens_enviadas, todos os registros)
      const { count: enviadosCount } = await supabase
        .from('mensagens_enviadas')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'enviado');
      const totalRecordsMensagens = sentMessagesGlobalCount || 0;
      const deliveryRate = totalRecordsMensagens > 0 ? ((enviadosCount || 0) / totalRecordsMensagens) * 100 : 0;
      
      // Leitura global (event_messages + mensagens_enviadas) com contagem
      const { count: readEventCount } = await supabase
        .from('event_messages')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .not('read_at', 'is', null);
      const { count: readSentCount } = await supabase
        .from('mensagens_enviadas')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .not('data_leitura', 'is', null);
      const readMessages = (readEventCount || 0) + (readSentCount || 0);
      const openRate = totalMessages > 0 ? (readMessages / totalMessages) * 100 : 0;

      // Calcular respostas e taxa de resposta (HISTÓRICO COMPLETO) usando apenas 'mensagens_enviadas'
      const { count: respondedSentCount } = await supabase
        .from('mensagens_enviadas')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .not('data_resposta', 'is', null);
      const { count: sentProcessedCount } = await supabase
        .from('mensagens_enviadas')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .in('status', ['enviado', 'enviada', 'erro']);
      const respondedMessages = respondedSentCount || 0;
      const responseRate = (sentProcessedCount || 0) > 0
        ? (respondedMessages / (sentProcessedCount || 0)) * 100
        : 0;

      // Atividade diária por todo o histórico (mensagens_enviadas)
      // Agora: 'Mensagens' por data_envio; 'Respostas' por data_resposta (sem filtro de status)
      const messageCountByDate: Record<string, number> = {};
      const responseCountByDate: Record<string, number> = {};

      for (const m of (allSentMessages || [])) {
        const sendKey = m.data_envio ? normalizeKeyFromString(m.data_envio) : '';
        if (sendKey) {
          messageCountByDate[sendKey] = (messageCountByDate[sendKey] || 0) + 1;
        }
        const responseKey = m.data_resposta ? normalizeKeyFromString(m.data_resposta) : '';
        if (responseKey) {
          responseCountByDate[responseKey] = (responseCountByDate[responseKey] || 0) + 1;
        }
      }

      // Limitar a exibição aos últimos 14 dias (horário local), incluindo hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDateLocal = new Date(today);
      startDateLocal.setDate(today.getDate() - 13); // 14 dias (hoje + 13 dias anteriores)
      
      const last14Keys: string[] = [];
      for (let d = new Date(startDateLocal); d <= today; d.setDate(d.getDate() + 1)) {
        last14Keys.push(toDateKey(d));
      }

      // Filtrar apenas os dados dos últimos 14 dias e verificar no servidor para sincronização exata
      const serverMessageCountByDate: Record<string, number> = {};
      const serverResponseCountByDate: Record<string, number> = {};

      await Promise.all(
        last14Keys.map(async (key) => {
          const startLocal = new Date(`${key}T00:00:00`);
          const endLocal = new Date(startLocal);
          endLocal.setDate(startLocal.getDate() + 1);
          const startISO = startLocal.toISOString();
          const endISO = endLocal.toISOString();

          // Mensagens por data_envio (preferir filtro por intervalo; fallback para LIKE)
          let msgCount = 0;
          const { count: msgRangeCount, error: msgRangeErr } = await supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .gte('data_envio', startISO)
            .lt('data_envio', endISO);
          msgCount = msgRangeCount || 0;
          if (msgCount === 0) {
            try {
              const { count: msgLikeCount } = await supabase
                .from('mensagens_enviadas')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organization.id)
                .like('data_envio', `${key}%`);
              msgCount = msgLikeCount || msgCount;
            } catch (_) {
              // Ignorar se LIKE não for suportado para o tipo da coluna
            }
          }

          // Respostas por data_resposta (preferir filtro por intervalo; fallback para LIKE)
          let respCount = 0;
          const { count: respRangeCount, error: respRangeErr } = await supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .gte('data_resposta', startISO)
            .lt('data_resposta', endISO);
          respCount = respRangeCount || 0;
          if (respCount === 0) {
            try {
              const { count: respLikeCount } = await supabase
                .from('mensagens_enviadas')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organization.id)
                .like('data_resposta', `${key}%`);
              respCount = respLikeCount || respCount;
            } catch (_) {
              // Ignorar se LIKE não for suportado para o tipo da coluna
            }
          }

          serverMessageCountByDate[key] = msgCount;
          serverResponseCountByDate[key] = respCount;
        })
      );

      const dailyActivity = last14Keys.map((key) => ({
        date: toDisplayDDMM(key),
        // Preferir contagens do servidor para sincronizar 100% com o banco; cair para agregação local se indisponível
        messages: (serverMessageCountByDate[key] ?? messageCountByDate[key] ?? 0),
        responses: (serverResponseCountByDate[key] ?? responseCountByDate[key] ?? 0),
        contacts: totalContacts,
      }));

      const contactsByTag = tagsData?.map(tag => ({
        name: tag.name,
        count: Math.floor(Math.random() * 1000) + 100,
        color: tag.color,
      })) || [];

      const campaignPerformance = await Promise.all(
        (campaigns || []).slice(0, 2).map(async (campaign: any) => {
          const [
            { count: sentCount },
            { count: deliveredCount },
            { count: readCount },
            { count: respondedCount },
            { count: errorsCount },
          ] = await Promise.all([
            supabase
              .from('mensagens_enviadas')
              .select('id', { count: 'exact', head: true })
              .eq('id_campanha', campaign.id)
              .in('status', ['enviado', 'enviada', 'erro']),
            supabase
              .from('mensagens_enviadas')
              .select('id', { count: 'exact', head: true })
              .eq('id_campanha', campaign.id)
              .in('status', ['enviado', 'enviada']),
            supabase
              .from('mensagens_enviadas')
              .select('id', { count: 'exact', head: true })
              .eq('id_campanha', campaign.id)
              .not('data_leitura', 'is', null),
            supabase
              .from('mensagens_enviadas')
              .select('id', { count: 'exact', head: true })
              .eq('id_campanha', campaign.id)
              .not('data_resposta', 'is', null),
            supabase
              .from('mensagens_enviadas')
              .select('id', { count: 'exact', head: true })
              .eq('id_campanha', campaign.id)
              .eq('status', 'erro'),
          ]);

          return {
            name: campaign.name || 'Campanha',
            sent: sentCount || 0,
            delivered: deliveredCount || 0,
            read: readCount || 0,
            responded: respondedCount || 0,
            errors: errorsCount || 0,
          };
        })
      );

      const totalClassified =
        (sentimentCounts[SENTIMENT_VALUES.SUPER_ENGAJADO] || 0) +
        (sentimentCounts[SENTIMENT_VALUES.POSITIVO] || 0) +
        (sentimentCounts[SENTIMENT_VALUES.NEUTRO] || 0) +
        (sentimentCounts[SENTIMENT_VALUES.NEGATIVO] || 0);

      const globalSentimentDistribution = [
        {
          sentiment: 'Super Engajado',
          count: sentimentCounts[SENTIMENT_VALUES.SUPER_ENGAJADO],
          percentage: totalClassified > 0 ? (sentimentCounts[SENTIMENT_VALUES.SUPER_ENGAJADO] / totalClassified) * 100 : 0,
          color: '#FF6B35',
        },
        {
          sentiment: 'Positivo',
          count: sentimentCounts[SENTIMENT_VALUES.POSITIVO],
          percentage: totalClassified > 0 ? (sentimentCounts[SENTIMENT_VALUES.POSITIVO] / totalClassified) * 100 : 0,
          color: '#10B981',
        },
        {
          sentiment: 'Neutro',
          count: sentimentCounts[SENTIMENT_VALUES.NEUTRO],
          percentage: totalClassified > 0 ? (sentimentCounts[SENTIMENT_VALUES.NEUTRO] / totalClassified) * 100 : 0,
          color: '#6B7280',
        },
        {
          sentiment: 'Negativo',
          count: sentimentCounts[SENTIMENT_VALUES.NEGATIVO],
          percentage: totalClassified > 0 ? (sentimentCounts[SENTIMENT_VALUES.NEGATIVO] / totalClassified) * 100 : 0,
          color: '#EF4444',
        },
      ];

      // Construir distribuição de perfis com cores determinísticas
      const profilesSorted = Object.entries(profileCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([profile]) => profile);
      const profileColorMap = generateProfileColors(profilesSorted);
      const totalProfilesCount = Object.values(profileCounts).reduce((acc, val) => acc + val, 0);
      const contactsByProfile = profilesSorted.map((profile) => ({
        profile,
        count: profileCounts[profile] || 0,
        percentage: totalProfilesCount > 0 ? ((profileCounts[profile] || 0) / totalProfilesCount) * 100 : 0,
        color: profileColorMap[profile] || '#9CA3AF',
      }));

      return {
        totalContacts,
        activeContacts,
        totalCampaigns,
        activeCampaigns,
        totalMessages,
        deliveryRate,
        openRate,
        responseRate,
        contactsByTag,
        contactsByProfile,
        campaignPerformance,
        dailyActivity,
        globalSentiment: {
          distribution: globalSentimentDistribution,
          totalClassified,
        },
        // Adicionado: retornar o denominador
        sentProcessedCount: sentProcessedCount || 0,
        // Novo: retornar total de respostas
        responsesCount: respondedMessages || 0,
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
