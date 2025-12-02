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

  if (analytics.queuedMessages > 0) {
    return 'sending';
  }

  if (analytics.errorMessages > 0 && analytics.deliveredMessages === 0) {
    return 'failed';
  }

  return 'completed';
}

function normalizeStatus(status: string): string {
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
    let orgSlug = url.searchParams.get('orgSlug');
    let eventSlug = url.searchParams.get('eventSlug');

    // If not in query params, try to get from request body
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        eventId = body.eventId || eventId;
        selectedDate = body.selectedDate || selectedDate;
        orgSlug = body.orgSlug || orgSlug;
        eventSlug = body.eventSlug || eventSlug;
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let event: any = null;

    // Try to find event by orgSlug + eventSlug first
    if (orgSlug && eventSlug) {
      console.log('Finding event by orgSlug:', orgSlug, 'eventSlug:', eventSlug);
      
      // Get organization by slug
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .single();

      if (orgError || !org) {
        console.error('Organization not found:', orgError);
        return new Response(
          JSON.stringify({ error: 'Organization not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get event by organization_id and slug
      const { data: eventBySlug, error: eventSlugError } = await supabase
        .from('events')
        .select('id, event_id, name, event_date, location, message_text, message_image, status, organization_id, slug')
        .eq('organization_id', org.id)
        .eq('slug', eventSlug)
        .single();

      if (eventSlugError || !eventBySlug) {
        console.error('Event not found by slug:', eventSlugError);
        return new Response(
          JSON.stringify({ error: 'Event not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      event = eventBySlug;
    } else if (eventId) {
      // Fallback: Fetch event by UUID id (primary key) or event_id
      console.log('Fetching event with ID:', eventId);

      // Try UUID first
      let { data: eventById, error: eventError } = await supabase
        .from('events')
        .select('id, event_id, name, event_date, location, message_text, message_image, status, organization_id, slug')
        .eq('id', eventId)
        .single();

      if (eventError) {
        // Try event_id (legacy)
        const { data: eventByEventId, error: eventIdError } = await supabase
          .from('events')
          .select('id, event_id, name, event_date, location, message_text, message_image, status, organization_id, slug')
          .eq('event_id', eventId)
          .single();

        if (eventIdError) {
          console.error('Event not found:', eventIdError);
          return new Response(
            JSON.stringify({ error: 'Event not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        event = eventByEventId;
      } else {
        event = eventById;
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Event ID or slugs required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Event found:', event.name);

    // Date filter setup
    let startOfDayISO: string | undefined;
    let endOfDayISO: string | undefined;

    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      startOfDayISO = startOfDay.toISOString();
      endOfDayISO = endOfDay.toISOString();
    }

    // Fetch messages data for analytics
    let messagesData: any[] = [];
    
    let query1 = supabase
      .from('mensagens_enviadas')
      .select('status, data_envio, data_leitura, data_resposta, sentimento, perfil_contato')
      .eq('id_campanha', event.id);

    if (startOfDayISO && endOfDayISO) {
      query1 = query1.gte('data_envio', startOfDayISO).lt('data_envio', endOfDayISO);
    }

    const { data: messages1 } = await query1;

    if (messages1 && messages1.length > 0) {
      messagesData = messages1;
      console.log('Found messages in mensagens_enviadas:', messages1.length);
    } else {
      let query2 = supabase
        .from('event_messages')
        .select('status, sent_at as data_envio, read_at as data_leitura, responded_at as data_resposta, sentiment as sentimento, contact_profile as perfil_contato')
        .eq('event_id', event.id);

      if (startOfDayISO && endOfDayISO) {
        query2 = query2.gte('sent_at', startOfDayISO).lt('sent_at', endOfDayISO);
      }

      const { data: messages2 } = await query2;

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
      }
    }
    
    const normalizedMessages = messagesData.map(msg => ({
      ...msg,
      status: normalizeStatus(msg.status || 'fila'),
      sentimento: normalizeSentiment(msg.sentimento),
    }));

    // Calculate analytics with server-side accurate counts
    let totalMessages = normalizedMessages.length;
    let queuedMessages = normalizedMessages.filter(m => m.status === 'fila').length;
    let readMessages = normalizedMessages.filter(m => m.status === 'lido').length;
    let responseMessages = normalizedMessages.filter(m => 
      m.status === 'respondido' || m.data_resposta != null
    ).length;
    let errorMessages = normalizedMessages.filter(m => m.status === 'erro').length;
    let deliveredMessages = normalizedMessages.filter(m => m.status === 'enviado').length;
    let sentMessages = deliveredMessages + errorMessages;

    try {
      const applyMeFilters = (q: any) => {
        let qq = q.eq('id_campanha', event.id);
        if (startOfDayISO && endOfDayISO) {
          qq = qq.gte('data_envio', startOfDayISO).lt('data_envio', endOfDayISO);
        }
        return qq;
      };

      const [meTotal, meQueued, meRead, meResponded, meError, meDelivered] = await Promise.all([
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
      }
    } catch (e) {
      console.warn('Public analytics: falling back to client-side counts due to error:', e);
    }

    const progressMessages = totalMessages - queuedMessages;
    const progressRate = totalMessages > 0 ? (progressMessages / totalMessages) * 100 : 0;
    const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
    const readRate = deliveredMessages > 0 ? (readMessages / deliveredMessages) * 100 : 0;
    const responseRate = readMessages > 0 ? (responseMessages / readMessages) * 100 : 
                        (totalMessages > 0 ? (responseMessages / totalMessages) * 100 : 0);
    
    console.log('Public analytics calculated:', {
      totalMessages, queuedMessages, deliveredMessages, readMessages, 
      responseMessages, errorMessages, deliveryRate, readRate, responseRate, progressRate
    });

    // Process hourly activity
    const hourlyData: Record<string, { enviados: number; respondidos: number }> = {};
    const filteredMessages = normalizedMessages;
    
    filteredMessages.forEach(message => {
      if (!message.data_envio) return;

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

    // Status distribution
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
      'pendente': '#F59E0B',
    };

    const statusDistribution = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
      color: statusColors[status] || '#9CA3AF'
    }));

    // Sentiment analysis
    const sentimentCounts = {
      'super_engajado': normalizedMessages.filter(m => m.sentimento === 'super engajado').length,
      'positivo': normalizedMessages.filter(m => m.sentimento === 'positivo').length,
      'neutro': normalizedMessages.filter(m => m.sentimento === 'neutro').length,
      'negativo': normalizedMessages.filter(m => m.sentimento === 'negativo').length,
      'sem_classificacao': normalizedMessages.filter(m => !m.sentimento || m.sentimento === null).length,
    };

    const sentimentTotal = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);

    const sentimentDistribution = [
      { sentiment: 'Super Engajado', count: sentimentCounts.super_engajado, percentage: sentimentTotal > 0 ? (sentimentCounts.super_engajado / sentimentTotal) * 100 : 0, color: '#FF6B35', emoji: '🔥' },
      { sentiment: 'Positivo', count: sentimentCounts.positivo, percentage: sentimentTotal > 0 ? (sentimentCounts.positivo / sentimentTotal) * 100 : 0, color: '#10B981', emoji: '😊' },
      { sentiment: 'Neutro', count: sentimentCounts.neutro, percentage: sentimentTotal > 0 ? (sentimentCounts.neutro / sentimentTotal) * 100 : 0, color: '#6B7280', emoji: '😐' },
      { sentiment: 'Negativo', count: sentimentCounts.negativo, percentage: sentimentTotal > 0 ? (sentimentCounts.negativo / sentimentTotal) * 100 : 0, color: '#EF4444', emoji: '😞' },
      { sentiment: 'Sem Classificação', count: sentimentCounts.sem_classificacao, percentage: sentimentTotal > 0 ? (sentimentCounts.sem_classificacao / sentimentTotal) * 100 : 0, color: '#D1D5DB', emoji: '⚪' }
    ];

    // Profile analysis
    const profileCounts = new Map<string, number>();
    normalizedMessages.forEach(message => {
      if (message.perfil_contato) {
        profileCounts.set(message.perfil_contato, (profileCounts.get(message.perfil_contato) || 0) + 1);
      }
    });

    const profileColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    const profileDistribution = Array.from(profileCounts.entries())
      .map(([profile, count], index) => ({
        profile,
        count,
        percentage: totalMessages > 0 ? (count / totalMessages) * 100 : 0,
        color: profileColors[index % profileColors.length]
      }))
      .sort((a, b) => b.count - a.count);

    const analytics = {
      totalMessages,
      queuedMessages,
      sentMessages,
      deliveredMessages,
      readMessages,
      responseMessages,
      errorMessages,
      progressRate,
      deliveryRate,
      readRate,
      responseRate,
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

    const computedStatus = computeEventStatus(analytics);

    const responseData: EventWithAnalytics = {
      id: event.id,
      event_id: event.event_id,
      name: event.name,
      event_date: event.event_date,
      location: event.location,
      message_text: event.message_text,
      message_image: event.message_image,
      status: event.status,
      computedStatus,
      analytics
    };

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in public-event-status function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
