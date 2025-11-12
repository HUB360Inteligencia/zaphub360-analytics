
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
  // Adicionado: contador usado como denominador da taxa de resposta
  sentProcessedCount: number;
  // Novo: total de respostas (data_resposta não nula) no histórico
  responsesCount: number;
  // Comparação com período anterior
  previousPeriod: {
    totalMessages: number;
    deliveredMessagesCount: number;
    respondedMessagesCount: number;
    deliveryRate: number;
    openRate: number;
    responseRate: number;
  };
  // NOVOS: Análises avançadas
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
    tempo_medio_resposta: number | null;
    melhor_horario: string | null;
  }[];
}

interface CampaignMetrics {
  sent?: number;
  delivered?: number;
  read?: number;
  failed?: number;
}

// Helper function to calculate date range based on timeRange string
// Returns null for both dates when timeRange is 'all' (no date filter)
function calculateDateRange(timeRange?: string): { startDate: Date | null; endDate: Date | null } {
  // Se timeRange for 'all', retornar null para indicar "sem filtro de período"
  if (timeRange === 'all') {
    return { startDate: null, endDate: null };
  }
  
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  
  if (!timeRange) {
    // Default: últimos 30 dias (para relatórios)
    startDate.setDate(endDate.getDate() - 30);
    return { startDate, endDate };
  }
  
  switch(timeRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }
  
  return { startDate, endDate };
}

export const useAnalytics = (timeRange?: string) => {
  const { organization } = useAuth();

  const analyticsQuery = useQuery({
    queryKey: ['analytics', organization?.id, timeRange],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!organization?.id) {
        return {
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
          // Adicionado: default
          sentProcessedCount: 0,
          // Novo: default
          responsesCount: 0,
          previousPeriod: {
            totalMessages: 0,
            deliveredMessagesCount: 0,
            respondedMessagesCount: 0,
            deliveryRate: 0,
            openRate: 0,
            responseRate: 0,
          },
        };
      }

      // Calcular range de datas baseado no timeRange
      const { startDate, endDate } = calculateDateRange(timeRange);
      const hasTimeFilter = startDate !== null && endDate !== null;
      const startDateISO = hasTimeFilter ? startDate!.toISOString() : null;
      const endDateISO = hasTimeFilter ? endDate!.toISOString() : null;

      // Calcular período anterior (apenas se houver filtro de tempo)
      let previousStartDateISO: string | null = null;
      let previousEndDateISO: string | null = null;
      if (hasTimeFilter) {
        const periodDuration = endDate!.getTime() - startDate!.getTime();
        const previousEndDate = new Date(startDate!.getTime() - 1); // 1ms antes do período atual
        const previousStartDate = new Date(previousEndDate.getTime() - periodDuration);
        previousStartDateISO = previousStartDate.toISOString();
        previousEndDateISO = previousEndDate.toISOString();
      }

      // Buscar contatos - count total
      const { count: totalContactsCount } = await supabase
        .from('new_contact_event')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

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

      // Buscar mensagens de eventos (COM ou SEM filtro de período) para métricas
      let eventMessagesQuery = supabase
        .from('event_messages')
        .select('status, sent_at, delivered_at, read_at, responded_at')
        .eq('organization_id', organization.id);
      if (hasTimeFilter && startDateISO && endDateISO) {
        eventMessagesQuery = eventMessagesQuery
          .gte('sent_at', startDateISO)
          .lte('sent_at', endDateISO);
      }
      const { data: eventMessages } = await eventMessagesQuery;

      // Adicionar contagens de mensagens (com ou sem filtro de período)
      let eventMessagesCountQuery = supabase
        .from('event_messages')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id);
      if (hasTimeFilter && startDateISO && endDateISO) {
        eventMessagesCountQuery = eventMessagesCountQuery
          .gte('sent_at', startDateISO)
          .lte('sent_at', endDateISO);
      }
      const { count: eventMessagesCount } = await eventMessagesCountQuery;

      // Total de mensagens = apenas 'enviado' + 'erro' (mensagens que foram processadas)
      let sentMessagesGlobalQuery = supabase
        .from('mensagens_enviadas')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .in('status', ['enviado', 'erro']);
      if (hasTimeFilter && startDateISO && endDateISO) {
        sentMessagesGlobalQuery = sentMessagesGlobalQuery
          .gte('data_envio', startDateISO)
          .lte('data_envio', endDateISO);
      }
      const { count: sentMessagesGlobalCount } = await sentMessagesGlobalQuery;

      // Buscar mensagens enviadas (com ou sem filtro de período) para dailyActivity
      // Apenas mensagens processadas (enviado + erro)
      const pageSize = 5000;
      let fromIdx = 0;
      let toIdx = pageSize - 1;
      let allSentMessages: any[] = [];
      
      while (true) {
        let pageQuery = supabase
          .from('mensagens_enviadas')
          .select('id, status, data_envio, data_leitura, data_resposta')
          .eq('organization_id', organization.id)
          .in('status', ['enviado', 'erro']);
        
        if (hasTimeFilter && startDateISO && endDateISO) {
          pageQuery = pageQuery
            .gte('data_envio', startDateISO)
            .lte('data_envio', endDateISO);
        }
        
        pageQuery = pageQuery
          .order('data_envio', { ascending: false })
          .range(fromIdx, toIdx);
          
        const { data: page } = await pageQuery;
        if (!page || page.length === 0) break;
        allSentMessages = allSentMessages.concat(page);
        if (page.length < pageSize) break;
        fromIdx += pageSize;
        toIdx += pageSize;
      }

      // Buscar tags com id para contar contatos
      const { data: tagsData } = await supabase
        .from('tags')
        .select('id, name, color')
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
      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const totalMessages = (eventMessagesCount || 0) + (sentMessagesGlobalCount || 0);

      // Calcular métricas de entrega com contagem (com ou sem filtro de período)
      let enviadosQuery = supabase
        .from('mensagens_enviadas')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'enviado');
      if (hasTimeFilter && startDateISO && endDateISO) {
        enviadosQuery = enviadosQuery
          .gte('data_envio', startDateISO)
          .lte('data_envio', endDateISO);
      }
      const { count: enviadosCount } = await enviadosQuery;
      
      // Contar mensagens com erro (com ou sem filtro de período)
      let errorQuery = supabase
        .from('mensagens_enviadas')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'erro');
      if (hasTimeFilter && startDateISO && endDateISO) {
        errorQuery = errorQuery
          .gte('data_envio', startDateISO)
          .lte('data_envio', endDateISO);
      }
      const { count: errorCount } = await errorQuery;
      
      const totalRecordsMensagens = sentMessagesGlobalCount || 0;
      const deliveryRate = totalRecordsMensagens > 0 ? ((enviadosCount || 0) / totalRecordsMensagens) * 100 : 0;
      
      // Leitura (event_messages + mensagens_enviadas) com contagem (com ou sem filtro)
      let readEventQuery = supabase
        .from('event_messages')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .not('read_at', 'is', null);
      if (hasTimeFilter && startDateISO && endDateISO) {
        readEventQuery = readEventQuery
          .gte('sent_at', startDateISO)
          .lte('sent_at', endDateISO);
      }
      const { count: readEventCount } = await readEventQuery;
      
      let readSentQuery = supabase
        .from('mensagens_enviadas')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .not('data_leitura', 'is', null);
      if (hasTimeFilter && startDateISO && endDateISO) {
        readSentQuery = readSentQuery
          .gte('data_envio', startDateISO)
          .lte('data_envio', endDateISO);
      }
      const { count: readSentCount } = await readSentQuery;
      const readMessages = (readEventCount || 0) + (readSentCount || 0);
      const openRate = totalMessages > 0 ? (readMessages / totalMessages) * 100 : 0;

      // Calcular respostas e taxa de resposta usando 'mensagens_enviadas' (com ou sem filtro)
      let respondedSentQuery = supabase
        .from('mensagens_enviadas')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .not('data_resposta', 'is', null);
      if (hasTimeFilter && startDateISO && endDateISO) {
        respondedSentQuery = respondedSentQuery
          .gte('data_envio', startDateISO)
          .lte('data_envio', endDateISO);
      }
      const { count: respondedSentCount } = await respondedSentQuery;
      
      let sentProcessedQuery = supabase
        .from('mensagens_enviadas')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .in('status', ['enviado', 'enviada', 'erro']);
      if (hasTimeFilter && startDateISO && endDateISO) {
        sentProcessedQuery = sentProcessedQuery
          .gte('data_envio', startDateISO)
          .lte('data_envio', endDateISO);
      }
      const { count: sentProcessedCount } = await sentProcessedQuery;
      const respondedMessages = respondedSentCount || 0;
      const responseRate = (sentProcessedCount || 0) > 0
        ? (respondedMessages / (sentProcessedCount || 0)) * 100
        : 0;

      // Atividade diária (mensagens_enviadas)
      // 'Mensagens' por data_envio; 'Respostas' por data_resposta
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

      // Gerar keys para os dias do período
      // Se não houver filtro de tempo, usar últimos 30 dias para gráfico visual
      const periodKeys: string[] = [];
      const periodStart = hasTimeFilter ? startDate! : (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        d.setHours(0, 0, 0, 0);
        return d;
      })();
      const periodEnd = hasTimeFilter ? endDate! : new Date();
      
      const currentDate = new Date(periodStart);
      while (currentDate <= periodEnd) {
        periodKeys.push(toDateKey(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Verificar contagens no servidor para sincronização exata
      const serverMessageCountByDate: Record<string, number> = {};
      const serverResponseCountByDate: Record<string, number> = {};

      await Promise.all(
        periodKeys.map(async (key) => {
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

      const dailyActivity = periodKeys.map((key) => ({
        date: toDisplayDDMM(key),
        // Preferir contagens do servidor para sincronizar 100% com o banco; cair para agregação local se indisponível
        messages: (serverMessageCountByDate[key] ?? messageCountByDate[key] ?? 0),
        responses: (serverResponseCountByDate[key] ?? responseCountByDate[key] ?? 0),
        contacts: totalContacts,
      }));

      // Buscar contagem real de contatos por tag e calcular engajamento
      const contactsByTag = await Promise.all(
        (tagsData || []).map(async (tag) => {
          // Contar contatos com esta tag
          const { count: contactCount } = await supabase
            .from('contact_tags')
            .select('*', { count: 'exact', head: true })
            .eq('tag_id', tag.id);
          
          // Buscar telefones dos contatos com esta tag
          const { data: contactPhones } = await supabase
            .from('contact_tags')
            .select('contact_id')
            .eq('tag_id', tag.id);
          
          const phoneList = contactPhones?.map(ct => ct.contact_id) || [];
          
          if (phoneList.length === 0) {
            return {
              name: tag.name,
              count: contactCount || 0,
              color: tag.color,
              engagementRate: 0,
            };
          }
          
          // Contar mensagens enviadas para esses contatos (com ou sem filtro de período)
          let sentToTagQuery = supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .in('celular', phoneList);
          if (hasTimeFilter && startDateISO && endDateISO) {
            sentToTagQuery = sentToTagQuery
              .gte('data_envio', startDateISO)
              .lte('data_envio', endDateISO);
          }
          const { count: sentToTagCount } = await sentToTagQuery;
          
          // Contar mensagens respondidas desses contatos (com ou sem filtro de período)
          let respondedFromTagQuery = supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .in('celular', phoneList)
            .not('data_resposta', 'is', null);
          if (hasTimeFilter && startDateISO && endDateISO) {
            respondedFromTagQuery = respondedFromTagQuery
              .gte('data_envio', startDateISO)
              .lte('data_envio', endDateISO);
          }
          const { count: respondedFromTagCount } = await respondedFromTagQuery;
          
          const engagementRate = (sentToTagCount || 0) > 0 
            ? ((respondedFromTagCount || 0) / (sentToTagCount || 0)) * 100 
            : 0;
          
          return {
            name: tag.name,
            count: contactCount || 0,
            color: tag.color,
            engagementRate,
          };
        })
      );

      const campaignPerformance = await Promise.all(
        (campaigns || []).slice(0, 2).map(async (campaign: any) => {
          // Construir queries com filtros condicionais
          let sentQuery = supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('id_campanha', campaign.id)
            .in('status', ['enviado', 'enviada', 'erro']);
          if (hasTimeFilter && startDateISO && endDateISO) {
            sentQuery = sentQuery.gte('data_envio', startDateISO).lte('data_envio', endDateISO);
          }
          
          let deliveredQuery = supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('id_campanha', campaign.id)
            .in('status', ['enviado', 'enviada']);
          if (hasTimeFilter && startDateISO && endDateISO) {
            deliveredQuery = deliveredQuery.gte('data_envio', startDateISO).lte('data_envio', endDateISO);
          }
          
          let readQuery = supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('id_campanha', campaign.id)
            .not('data_leitura', 'is', null);
          if (hasTimeFilter && startDateISO && endDateISO) {
            readQuery = readQuery.gte('data_envio', startDateISO).lte('data_envio', endDateISO);
          }
          
          let respondedQuery = supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('id_campanha', campaign.id)
            .not('data_resposta', 'is', null);
          if (hasTimeFilter && startDateISO && endDateISO) {
            respondedQuery = respondedQuery.gte('data_envio', startDateISO).lte('data_envio', endDateISO);
          }
          
          let errorsQuery = supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('id_campanha', campaign.id)
            .eq('status', 'erro');
          if (hasTimeFilter && startDateISO && endDateISO) {
            errorsQuery = errorsQuery.gte('data_envio', startDateISO).lte('data_envio', endDateISO);
          }
          
          const [
            { count: sentCount },
            { count: deliveredCount },
            { count: readCount },
            { count: respondedCount },
            { count: errorsCount },
          ] = await Promise.all([
            sentQuery,
            deliveredQuery,
            readQuery,
            respondedQuery,
            errorsQuery,
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

      // Buscar templates para calcular performance
      const { data: templatesData } = await supabase
        .from('message_templates')
        .select('id')
        .eq('organization_id', organization.id);
      
      const templatePerformance = await Promise.all(
        (templatesData || []).map(async (template) => {
          // Construir queries com filtros condicionais para templates
          let tempSentQuery = supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .eq('id_template', template.id);
          if (hasTimeFilter && startDateISO && endDateISO) {
            tempSentQuery = tempSentQuery.gte('data_envio', startDateISO).lte('data_envio', endDateISO);
          }
          
          let tempReadQuery = supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .eq('id_template', template.id)
            .not('data_leitura', 'is', null);
          if (hasTimeFilter && startDateISO && endDateISO) {
            tempReadQuery = tempReadQuery.gte('data_envio', startDateISO).lte('data_envio', endDateISO);
          }
          
          let tempRespondedQuery = supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .eq('id_template', template.id)
            .not('data_resposta', 'is', null);
          if (hasTimeFilter && startDateISO && endDateISO) {
            tempRespondedQuery = tempRespondedQuery.gte('data_envio', startDateISO).lte('data_envio', endDateISO);
          }
          
          const [
            { count: sentCount },
            { count: readCount },
            { count: respondedCount },
          ] = await Promise.all([
            tempSentQuery,
            tempReadQuery,
            tempRespondedQuery,
          ]);

          const openRate = (sentCount || 0) > 0 ? ((readCount || 0) / (sentCount || 0)) * 100 : 0;
          const responseRate = (sentCount || 0) > 0 ? ((respondedCount || 0) / (sentCount || 0)) * 100 : 0;

          return {
            templateId: template.id,
            sent: sentCount || 0,
            read: readCount || 0,
            responded: respondedCount || 0,
            openRate,
            responseRate,
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

      // Calcular atividade por hora do dia usando função PostgreSQL otimizada
      // Para modo 'all', usar últimos 30 dias (usamos periodStart/periodEnd já definidos)
      const hourlyStartISO = periodStart.toISOString();
      const hourlyEndISO = periodEnd.toISOString();
      const { data: hourlyData, error: hourlyError } = await supabase
        .rpc('get_hourly_activity', {
          p_organization_id: organization.id,
          p_start_date: hourlyStartISO,
          p_end_date: hourlyEndISO
        });

      if (hourlyError) {
        console.error('Erro ao buscar atividade por hora:', hourlyError);
      }

      // Criar mapa com os dados retornados
      const hourlyMessageCount: Record<number, number> = {};
      const hourlyResponseCount: Record<number, number> = {};
      
      (hourlyData || []).forEach((row: any) => {
        hourlyMessageCount[row.hour] = row.messages || 0;
        hourlyResponseCount[row.hour] = row.responses || 0;
      });

      // Gerar dados de 0 a 23 horas
      const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2, '0')}:00`,
        messages: hourlyMessageCount[i] || 0,
        responses: hourlyResponseCount[i] || 0,
      }));

      // Buscar métricas do período anterior para comparação (apenas se houver filtro de tempo)
      let prevTotalMessages = 0;
      let prevEnviadosCount = 0;
      let prevRespondedCount = 0;
      let prevDeliveryRate = 0;
      let prevOpenRate = 0;
      let prevResponseRate = 0;
      
      if (hasTimeFilter && previousStartDateISO && previousEndDateISO) {
        const [
          { count: prevEventMessagesCount },
          { count: prevSentMessagesCount },
          { count: prevEnviadosCountRaw },
          { count: prevReadEventCount },
          { count: prevReadSentCount },
          { count: prevRespondedCountRaw },
          { count: prevSentProcessedCount },
        ] = await Promise.all([
          supabase
            .from('event_messages')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .gte('sent_at', previousStartDateISO)
            .lte('sent_at', previousEndDateISO),
          supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .in('status', ['enviado', 'erro'])
            .gte('data_envio', previousStartDateISO)
            .lte('data_envio', previousEndDateISO),
          supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .eq('status', 'enviado')
            .gte('data_envio', previousStartDateISO)
            .lte('data_envio', previousEndDateISO),
          supabase
            .from('event_messages')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .not('read_at', 'is', null)
            .gte('sent_at', previousStartDateISO)
            .lte('sent_at', previousEndDateISO),
          supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .not('data_leitura', 'is', null)
            .gte('data_envio', previousStartDateISO)
            .lte('data_envio', previousEndDateISO),
          supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .not('data_resposta', 'is', null)
            .gte('data_envio', previousStartDateISO)
            .lte('data_envio', previousEndDateISO),
          supabase
            .from('mensagens_enviadas')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .in('status', ['enviado', 'enviada', 'erro'])
            .gte('data_envio', previousStartDateISO)
            .lte('data_envio', previousEndDateISO),
        ]);

        prevTotalMessages = (prevEventMessagesCount || 0) + (prevSentMessagesCount || 0);
        prevEnviadosCount = prevEnviadosCountRaw || 0;
        prevRespondedCount = prevRespondedCountRaw || 0;
        prevDeliveryRate = (prevSentMessagesCount || 0) > 0 
          ? ((prevEnviadosCountRaw || 0) / (prevSentMessagesCount || 0)) * 100 
          : 0;
        const prevReadMessages = (prevReadEventCount || 0) + (prevReadSentCount || 0);
        prevOpenRate = prevTotalMessages > 0 
          ? (prevReadMessages / prevTotalMessages) * 100 
          : 0;
        prevResponseRate = (prevSentProcessedCount || 0) > 0
          ? ((prevRespondedCountRaw || 0) / (prevSentProcessedCount || 0)) * 100
          : 0;
      }

      // ========== NOVAS ANÁLISES AVANÇADAS ==========
      
      // 1. Sentimento ao longo do tempo (diário)
      const sentimentByDate: Record<string, Record<string, number>> = {};
      for (const m of (allSentMessages || [])) {
        const dateKey = m.data_envio ? normalizeKeyFromString(m.data_envio) : '';
        if (!dateKey) continue;
        
        const sentiment = normalizeSentiment(m.sentimento);
        if (!sentiment) continue;
        
        if (!sentimentByDate[dateKey]) {
          sentimentByDate[dateKey] = {
            super_engajado: 0,
            positivo: 0,
            neutro: 0,
            negativo: 0
          };
        }
        sentimentByDate[dateKey][sentiment]++;
      }

      const sentimentTrend = periodKeys.map(key => ({
        date: toDisplayDDMM(key),
        super_engajado: sentimentByDate[key]?.super_engajado || 0,
        positivo: sentimentByDate[key]?.positivo || 0,
        neutro: sentimentByDate[key]?.neutro || 0,
        negativo: sentimentByDate[key]?.negativo || 0,
      }));

      // 2. Análise geográfica (Paraná)
      let geoQuery = supabase
        .from('new_contact_event')
        .select('cidade, celular, sentimento')
        .eq('organization_id', organization.id)
        .not('cidade', 'is', null);

      if (hasTimeFilter && startDateISO && endDateISO) {
        geoQuery = geoQuery.gte('created_at', startDateISO).lte('created_at', endDateISO);
      }

      const { data: geoContacts } = await geoQuery;

      // Agrupar por cidade e calcular métricas
      const cityMetrics: Record<string, any> = {};
      for (const contact of (geoContacts || [])) {
        const city = (contact.cidade || '').trim();
        if (!city) continue;
        
        if (!cityMetrics[city]) {
          cityMetrics[city] = {
            total: 0,
            sentimentos: {
              super_engajado: 0,
              positivo: 0,
              neutro: 0,
              negativo: 0
            }
          };
        }
        cityMetrics[city].total++;
        
        const sentiment = normalizeSentiment(contact.sentimento);
        if (sentiment) cityMetrics[city].sentimentos[sentiment]++;
      }

      // Buscar mensagens por cidade (com tratamento de erro)
      let geographicData: any[] = [];
      try {
        geographicData = await Promise.all(
          Object.keys(cityMetrics).map(async (city) => {
            try {
              const phones = (geoContacts || [])
                .filter(c => c.cidade?.trim() === city)
                .map(c => c.celular);
              
              if (phones.length === 0) {
                return {
                  cidade: city,
                  total_contatos: cityMetrics[city].total,
                  mensagens_enviadas: 0,
                  mensagens_respondidas: 0,
                  taxa_resposta: 0,
                  sentimento_predominante: 'neutro',
                };
              }

              // Limitar o número de telefones para evitar erros de query muito grande
              const limitedPhones = phones.slice(0, 100);

              let sentQuery = supabase
                .from('mensagens_enviadas')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organization.id)
                .in('celular', limitedPhones);
              
              let respQuery = supabase
                .from('mensagens_enviadas')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organization.id)
                .in('celular', limitedPhones)
                .not('data_resposta', 'is', null);
              
              if (hasTimeFilter && startDateISO && endDateISO) {
                sentQuery = sentQuery.gte('data_envio', startDateISO).lte('data_envio', endDateISO);
                respQuery = respQuery.gte('data_envio', startDateISO).lte('data_envio', endDateISO);
              }
              
              const [{ count: sent }, { count: resp }] = await Promise.all([sentQuery, respQuery]);
              
              // Sentimento predominante
              const sentCounts = cityMetrics[city].sentimentos;
              const predominanteEntry = Object.entries(sentCounts)
                .sort((a, b) => (b[1] as number) - (a[1] as number))[0];
              const predominante = predominanteEntry ? predominanteEntry[0] : 'neutro';
              
              return {
                cidade: city,
                total_contatos: cityMetrics[city].total,
                mensagens_enviadas: sent || 0,
                mensagens_respondidas: resp || 0,
                taxa_resposta: (sent || 0) > 0 ? ((resp || 0) / (sent || 0)) * 100 : 0,
                sentimento_predominante: predominante,
              };
            } catch (cityError) {
              console.error(`Erro ao processar cidade ${city}:`, cityError);
              return {
                cidade: city,
                total_contatos: cityMetrics[city].total,
                mensagens_enviadas: 0,
                mensagens_respondidas: 0,
                taxa_resposta: 0,
                sentimento_predominante: 'neutro',
              };
            }
          })
        );
      } catch (geoError) {
        console.error('Erro ao processar dados geográficos:', geoError);
        geographicData = [];
      }

      // 3. Análise de perfil expandida (com tratamento de erro)
      let profileAnalysis: any[] = [];
      try {
        profileAnalysis = await Promise.all(
          contactsByProfile.map(async (profileItem) => {
            try {
              const profile = profileItem.profile;
              
              // Buscar contatos desse perfil
              let profileContactsQuery = supabase
                .from('new_contact_event')
                .select('celular')
                .eq('organization_id', organization.id)
                .eq('profile', profile);
              
              const { data: profileContacts } = await profileContactsQuery;
              const phones = (profileContacts || []).map(c => c.celular);
              
              if (phones.length === 0) {
                return {
                  profile,
                  total_contatos: profileItem.count,
                  mensagens_enviadas: 0,
                  mensagens_respondidas: 0,
                  taxa_resposta: 0,
                  tempo_medio_resposta: null,
                  melhor_horario: null,
                };
              }

              // Limitar o número de telefones para evitar erros de query muito grande
              const limitedPhones = phones.slice(0, 100);

              // Buscar mensagens desse perfil
              let sentQueryProfile = supabase
                .from('mensagens_enviadas')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organization.id)
                .in('celular', limitedPhones);
              
              let respQueryProfile = supabase
                .from('mensagens_enviadas')
                .select('id, data_envio, data_resposta', { count: 'exact' })
                .eq('organization_id', organization.id)
                .in('celular', limitedPhones)
                .not('data_resposta', 'is', null);
              
              if (hasTimeFilter && startDateISO && endDateISO) {
                sentQueryProfile = sentQueryProfile.gte('data_envio', startDateISO).lte('data_envio', endDateISO);
                respQueryProfile = respQueryProfile.gte('data_envio', startDateISO).lte('data_envio', endDateISO);
              }
              
              const [{ count: sentProfile }, { data: respDataProfile, count: respProfile }] = await Promise.all([
                sentQueryProfile,
                respQueryProfile
              ]);
              
              // Calcular tempo médio de resposta
              let tempoMedioResposta: number | null = null;
              if (respDataProfile && respDataProfile.length > 0) {
                const tempos = respDataProfile
                  .filter((m: any) => m.data_envio && m.data_resposta)
                  .map((m: any) => {
                    const envio = new Date(m.data_envio);
                    const resposta = new Date(m.data_resposta);
                    return (resposta.getTime() - envio.getTime()) / (1000 * 60); // minutos
                  })
                  .filter((t: number) => t > 0 && t < 10080); // filtrar tempos inválidos (> 1 semana)
                
                if (tempos.length > 0) {
                  tempoMedioResposta = Math.round(tempos.reduce((a: number, b: number) => a + b, 0) / tempos.length);
                }
              }
              
              // Calcular melhor horário (horário com mais respostas)
              let melhorHorario: string | null = null;
              if (respDataProfile && respDataProfile.length > 0) {
                const hourCounts: Record<number, number> = {};
                respDataProfile.forEach((m: any) => {
                  if (m.data_resposta) {
                    const hour = new Date(m.data_resposta).getHours();
                    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                  }
                });
                
                if (Object.keys(hourCounts).length > 0) {
                  const bestHour = Object.entries(hourCounts)
                    .sort((a, b) => b[1] - a[1])[0][0];
                  melhorHorario = `${String(bestHour).padStart(2, '0')}:00`;
                }
              }
              
              return {
                profile,
                total_contatos: profileItem.count,
                mensagens_enviadas: sentProfile || 0,
                mensagens_respondidas: respProfile || 0,
                taxa_resposta: (sentProfile || 0) > 0 ? ((respProfile || 0) / (sentProfile || 0)) * 100 : 0,
                tempo_medio_resposta: tempoMedioResposta,
                melhor_horario: melhorHorario,
              };
            } catch (profileError) {
              console.error(`Erro ao processar perfil ${profileItem.profile}:`, profileError);
              return {
                profile: profileItem.profile,
                total_contatos: profileItem.count,
                mensagens_enviadas: 0,
                mensagens_respondidas: 0,
                taxa_resposta: 0,
                tempo_medio_resposta: null,
                melhor_horario: null,
              };
            }
          })
        );
      } catch (profileError) {
        console.error('Erro ao processar análise de perfil:', profileError);
        profileAnalysis = [];
      }

      return {
        totalContacts,
        totalCampaigns,
        activeCampaigns,
        totalMessages,
        deliveredMessagesCount: enviadosCount || 0,
        errorMessagesCount: errorCount || 0,
        respondedMessagesCount: respondedMessages,
        deliveryRate,
        openRate,
        responseRate,
        contactsByTag,
        contactsByProfile,
        campaignPerformance,
        templatePerformance,
        dailyActivity,
        hourlyActivity,
        globalSentiment: {
          distribution: globalSentimentDistribution,
          totalClassified,
        },
        // Adicionado: retornar o denominador
        sentProcessedCount: sentProcessedCount || 0,
        // Novo: retornar total de respostas
        responsesCount: respondedMessages || 0,
        previousPeriod: {
          totalMessages: prevTotalMessages,
          deliveredMessagesCount: prevEnviadosCount || 0,
          respondedMessagesCount: prevRespondedCount || 0,
          deliveryRate: prevDeliveryRate,
          openRate: prevOpenRate,
          responseRate: prevResponseRate,
        },
        // Novas análises avançadas
        sentimentTrend,
        geographicData: geographicData.sort((a, b) => b.total_contatos - a.total_contatos),
        profileAnalysis,
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
