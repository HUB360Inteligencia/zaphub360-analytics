import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventWithAnalytics {
  id: string;
  event_id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  message_text: string;
  message_image: string | null;
  status: string;
  computedStatus: string;
  analytics: any;
}

function computeEventStatus(analytics: any): string {
  if (!analytics || analytics.totalMessages === 0) {
    return 'draft';
  }

  // Progress = total - queued (unified logic)
  if (analytics.queuedMessages > 0) {
    return 'sending';
  }

  // Se todas as mensagens falharam e nenhuma foi entregue
  if (analytics.errorMessages > 0 && analytics.deliveredMessages === 0) {
    return 'failed';
  }

  return 'completed';
}

function normalizeStatus(status: string): string {
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
}

function normalizeSentiment(sentiment: string): string {
  if (!sentiment) return null as any;
  
  const normalized = sentiment.toLowerCase().trim();
  
  switch (normalized) {
    case 'super engajado':
    case 'super_engajado':
      return 'super engajado';
    case 'positivo':
      return 'positivo';
    case 'neutro':
      return 'neutro';
    case 'negativo':
      return 'negativo';
    default:
      return sentiment;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let eventId = url.searchParams.get('eventId');
    let selectedDate = url.searchParams.get('selectedDate');

    // If not in query params, try to get from request body
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        eventId = body.eventId || eventId;
        selectedDate = body.selectedDate || selectedDate;
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching event with ID:', eventId);

    // Fetch event by UUID id (primary key)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, event_id, name, event_date, location, message_text, message_image, status')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event:', eventError);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Event found:', event.name);

    // -------------------------------------------------------------
    // Filtro de data em BRT (America/Sao_Paulo) aplicado no banco
    // -------------------------------------------------------------
    let startOfDayISO: string | undefined;
    let endOfDayISO: string | undefined;

    if (selectedDate) {
      // selectedDate deve representar a meia-noite local que você quer comparar (BRT)
      const startOfDay = new Date(selectedDate);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      startOfDayISO = startOfDay.toISOString();
      endOfDayISO = endOfDay.toISOString();
    }

    // Fetch messages data for analytics - try multiple tables
    let messagesData: any[] = [];
    
    // First try mensagens_enviadas table
    let query1 = supabase
      .from('mensagens_enviadas')
      .select('status, data_envio, data_leitura, data_resposta, sentimento, perfil_contato')
      .eq('id_campanha', event.id);

    if (startOfDayISO && endOfDayISO) {
      query1 = query1
        .gte('data_envio', startOfDayISO)
        .lt('data_envio', endOfDayISO);
    }

    const { data: messages1, error: messagesError1 } = await query1;

    if (messages1 && messages1.length > 0) {
      messagesData = messages1;
      console.log('Found messages in mensagens_enviadas:', messages1.length);
    } else {
      // Try event_messages table if no messages in mensagens_enviadas
      let query2 = supabase
        .from('event_messages')
        .select('status, sent_at as data_envio, read_at as data_leitura, responded_at as data_resposta, sentiment as sentimento, contact_profile as perfil_contato')
        .eq('event_id', event.id);

      if (startOfDayISO && endOfDayISO) {
        query2 = query2
          .gte('sent_at', startOfDayISO)
          .lt('sent_at', endOfDayISO);
      }

      const { data: messages2, error: messagesError2 } = await query2;

      if (messages2 && messages2.length > 0) {
        messagesData = messages2.map(msg => ({
          status: msg.status,
          data_envio: msg.data_envio,
          data_leitura: msg.data_leitura,
          data_resposta: msg.data_resposta,
          sentimento: msg.sentimento,
          perfil_contato: msg.perfil_contato
        }));
        console.log('Found messages in event_messages:', messages2.length);
      } else {
        // Also try new_contact_event table for contact count
        const { data: contacts, error: contactsError } = await supabase
          .from('new_contact_event')
          .select('celular, sentimento, status_envio')
          .eq('event_id', event.event_id);

        if (contacts && contacts.length > 0) {
          messagesData = contacts.map(contact => ({
            status: contact.status_envio || 'fila',
            data_envio: null,
            data_leitura: null,
            data_resposta: null,
            sentimento: contact.sentimento,
            perfil_contato: null
          }));
          console.log('Found contacts in new_contact_event:', contacts.length);
        }
      }
    }
    
    // Normalize messages data to match private page logic
    const normalizedMessages = messagesData.map(msg => ({
      ...msg,
      status: normalizeStatus(msg.status || 'fila'),
      sentimento: normalizeSentiment(msg.sentimento),
    }));

    // Calculate analytics with server-side accurate counts to avoid 1000-row cap
    let totalMessages = normalizedMessages.length;
    let queuedMessages = normalizedMessages.filter(m => m.status === 'fila').length;
    let readMessages = normalizedMessages.filter(m => m.status === 'lido').length;
    // Improved response counting: status 'respondido' OR data_resposta exists
    let responseMessages = normalizedMessages.filter(m => 
      m.status === 'respondido' || m.data_resposta != null
    ).length;
    let errorMessages = normalizedMessages.filter(m => m.status === 'erro').length;
    
    // Enviados: "enviado" + "erro" statuses
    let deliveredMessages = normalizedMessages.filter(m => m.status === 'enviado').length;
    let sentMessages = deliveredMessages + errorMessages;

    try {
      // Primeiro: contar exatamente em mensagens_enviadas (tabela primária de campanha)
      const applyMeFilters = (q: any) => {
        let qq = q.eq('id_campanha', event.id);
        if (startOfDayISO && endOfDayISO) {
          qq = qq.gte('data_envio', startOfDayISO).lt('data_envio', endOfDayISO);
        }
        return qq;
      };

      const [
        meTotal,
        meQueued,
        meRead,
        meResponded,
        meError,
        meDelivered
      ] = await Promise.all([
        applyMeFilters(supabase.from('mensagens_enviadas').select('id', { count: 'exact', head: true })),
        applyMeFilters(supabase.from('mensagens_enviadas').select('id', { count: 'exact', head: true })).in('status', ['fila','pendente','processando']),
        applyMeFilters(supabase.from('mensagens_enviadas').select('id', { count: 'exact', head: true })).eq('status', 'lido'),
        applyMeFilters(supabase.from('mensagens_enviadas').select('id', { count: 'exact', head: true })).not('data_resposta', 'is', null),
        applyMeFilters(supabase.from('mensagens_enviadas').select('id', { count: 'exact', head: true })).eq('status', 'erro'),
        applyMeFilters(supabase.from('mensagens_enviadas').select('id', { count: 'exact', head: true })).eq('status', 'enviado'),
      ]);

      if ((meTotal.count ?? 0) > 0) {
        totalMessages = meTotal.count || totalMessages;
        queuedMessages = meQueued.count || queuedMessages;
        readMessages = meRead.count || readMessages;
        responseMessages = meResponded.count || responseMessages;
        errorMessages = meError.count || errorMessages;
        deliveredMessages = meDelivered.count || deliveredMessages;
        sentMessages = deliveredMessages + errorMessages;
      } else {
        // Fallback: contar exatamente em event_messages
        let totalQ = supabase
          .from('event_messages')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', event.id);

        let queuedQ = supabase
          .from('event_messages')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .in('status', ['queued', 'pending', 'processing']);

        let readQ = supabase
          .from('event_messages')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .not('read_at', 'is', null);

        let respondedQ = supabase
          .from('event_messages')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .not('responded_at', 'is', null);

        let errorQ = supabase
          .from('event_messages')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'failed');

        let deliveredQ = supabase
          .from('event_messages')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .in('status', ['sent', 'delivered']);

        if (startOfDayISO && endOfDayISO) {
          totalQ = totalQ.gte('sent_at', startOfDayISO).lt('sent_at', endOfDayISO);
          queuedQ = queuedQ.gte('sent_at', startOfDayISO).lt('sent_at', endOfDayISO);
          readQ = readQ.gte('sent_at', startOfDayISO).lt('sent_at', endOfDayISO);
          respondedQ = respondedQ.gte('sent_at', startOfDayISO).lt('sent_at', endOfDayISO);
          errorQ = errorQ.gte('sent_at', startOfDayISO).lt('sent_at', endOfDayISO);
          deliveredQ = deliveredQ.gte('sent_at', startOfDayISO).lt('sent_at', endOfDayISO);
        }

        const [
          totalRes,
          queuedRes,
          readRes,
          respondedRes,
          errorRes,
          deliveredRes
        ] = await Promise.all([
          totalQ,
          queuedQ,
          readQ,
          respondedQ,
          errorQ,
          deliveredQ
        ]);

        totalMessages = totalRes.count || totalMessages;
        queuedMessages = queuedRes.count || queuedMessages;
        readMessages = readRes.count || readMessages;
        responseMessages = respondedRes.count || responseMessages;
        errorMessages = errorRes.count || errorMessages;
        deliveredMessages = deliveredRes.count || deliveredMessages;
        sentMessages = deliveredMessages + errorMessages;
      }
    } catch (e) {
      console.warn('Public analytics: falling back to client-side counts due to error:', e);
    }

    // Progress = total - queued
    const progressMessages = totalMessages - queuedMessages;
    const progressRate = totalMessages > 0 ? (progressMessages / totalMessages) * 100 : 0;
    
    const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
    const readRate = deliveredMessages > 0 ? (readMessages / deliveredMessages) * 100 : 0;
    // Improved response rate: fallback to total if no reads
    const responseRate = readMessages > 0 ? (responseMessages / readMessages) * 100 : 
                        (totalMessages > 0 ? (responseMessages / totalMessages) * 100 : 0);
    
    // Log analytics for debugging
    console.log('Public analytics calculated (server-accurate counts):', {
      totalMessages, queuedMessages, deliveredMessages, readMessages, 
      responseMessages, errorMessages, deliveryRate, readRate, responseRate, progressRate
    });

    // Process hourly activity - format for new chart (enviados, respondidos)
    const hourlyData: Record<string, { enviados: number; respondidos: number }> = {};

    // Como o filtro por data já foi aplicado no banco, usamos todas as mensagens normalizadas
    const filteredMessages = normalizedMessages;
    
    filteredMessages.forEach(message => {
      if (!message.data_envio) return;

      // Extrai a hora em America/Sao_Paulo (BRT), igual ao que você vê no banco
      const hourStr = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        hour12: false,
        timeZone: 'America/Sao_Paulo',
      }).format(new Date(message.data_envio));

      const hour = Number(hourStr);
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { enviados: 0, respondidos: 0 };
      }
      
      // Enviados: toda mensagem com tentativa (status diferente de pendente/fila)
      if (!['pendente', 'fila'].includes(message.status)) {
        hourlyData[hourKey].enviados++;
      }
      
      if (message.data_resposta) {
        hourlyData[hourKey].respondidos++;
      }
    });

    const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
      const hour = `${i.toString().padStart(2, '0')}:00`;
      return {
        hour,
        enviados: hourlyData[hour]?.enviados || 0,
        respondidos: hourlyData[hour]?.respondidos || 0,
      };
    });

    // Calculate status distribution with exact colors from private page
    const statusCounts = new Map<string, number>();
    normalizedMessages.forEach(message => {
      const status = message.status || 'fila';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });

    const statusColors: Record<string, string> = {
      'fila': '#6B7280',
      'enviado': '#3B82F6',
      'lido': '#8B5CF6',
      'respondido': '#10B981',
      'erro': '#EF4444',
      'pendente': '#F59E0B', // Different from 'fila'
      // Legacy mappings
      'enviada': '#3B82F6',
      'entregue': '#10B981', 
      'respondida': '#10B981',
      'failed': '#EF4444',
      'pending': '#F59E0B',
      'delivered': '#10B981',
      'read': '#8B5CF6',
      'responded': '#10B981',
      'error': '#EF4444',
      'queued': '#6B7280',
    };

    const statusDistribution = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
      color: statusColors[status] || '#9CA3AF'
    }));

    // Calculate sentiment analysis with exact format from private page
    const sentimentCounts = {
      'super_engajado': normalizedMessages.filter(m => m.sentimento === 'super engajado').length,
      'positivo': normalizedMessages.filter(m => m.sentimento === 'positivo').length,
      'neutro': normalizedMessages.filter(m => m.sentimento === 'neutro').length,
      'negativo': normalizedMessages.filter(m => m.sentimento === 'negativo').length,
      'sem_classificacao': normalizedMessages.filter(m => !m.sentimento || m.sentimento === null).length,
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

    const sentimentAnalysis = {
      superEngajado: sentimentCounts.super_engajado,
      positivo: sentimentCounts.positivo,
      neutro: sentimentCounts.neutro,
      negativo: sentimentCounts.negativo,
      semClassificacao: sentimentCounts.sem_classificacao,
      distribution: sentimentDistribution
    };

    // Calculate profile analysis with exact format from private page
    const profileCounts: Record<string, number> = {};
    normalizedMessages.forEach(msg => {
      const profile = msg.perfil_contato || 'Sem classificação';
      profileCounts[profile] = (profileCounts[profile] || 0) + 1;
    });

    const profileTotal = Object.values(profileCounts).reduce((a, b) => a + b, 0);
    const profileList = Object.keys(profileCounts);
    
    // Generate deterministic colors
    const generateDeterministicColor = (index: number, total: number): string => {
      const hue = (index * 360) / total;
      const saturation = 65 + (index % 3) * 10;
      const lightness = 50 + (index % 2) * 10;
      return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
    };

    const profileColorMap: Record<string, string> = {};
    profileList.forEach((profile, index) => {
      profileColorMap[profile] = generateDeterministicColor(index, profileList.length);
    });
    
    const profileDistribution = Object.entries(profileCounts).map(([profile, count]) => ({
      profile,
      count,
      percentage: profileTotal > 0 ? (count / profileTotal) * 100 : 0,
      color: profileColorMap[profile]
    }));

    const profileAnalysis = {
      distribution: profileDistribution
    };

    const analytics = {
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
      sentimentAnalysis,
      profileAnalysis
    };

    const computedStatus = computeEventStatus(analytics);

    const result: EventWithAnalytics = {
      ...event,
      computedStatus,
      analytics,
    };

    console.log('Returning event data with computed status:', computedStatus);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in public-event-status function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
