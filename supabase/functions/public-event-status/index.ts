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
  if (!sentiment) return null;
  
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

    // Fetch event by event_id (string)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, event_id, name, event_date, location, message_text, message_image, status')
      .eq('event_id', eventId)
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

    // Fetch messages data for analytics - try multiple tables
    let messagesData = [];
    
    // First try mensagens_enviadas table
    const { data: messages1, error: messagesError1 } = await supabase
      .from('mensagens_enviadas')
      .select('status, data_envio, data_leitura, data_resposta, sentimento, perfil_contato')
      .eq('id_campanha', event.id);

    if (messages1 && messages1.length > 0) {
      messagesData = messages1;
      console.log('Found messages in mensagens_enviadas:', messages1.length);
    } else {
      // Try event_messages table if no messages in mensagens_enviadas
      const { data: messages2, error: messagesError2 } = await supabase
        .from('event_messages')
        .select('status, sent_at as data_envio, read_at as data_leitura, responded_at as data_resposta, sentiment as sentimento, contact_profile as perfil_contato')
        .eq('event_id', event.id);

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
      // Prefer exact counts from mensagens_enviadas
      const base = supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true }).eq('id_campanha', event.id);
      const [
        totalRes,
        queuedRes,
        readRes,
        respondedRes,
        errorRes,
        deliveredRes
      ] = await Promise.all([
        base,
        supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true }).eq('id_campanha', event.id).in('status', ['fila','pendente','processando']),
        supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true }).eq('id_campanha', event.id).eq('status', 'lido'),
        supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true }).eq('id_campanha', event.id).not('data_resposta', 'is', null),
        supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true }).eq('id_campanha', event.id).eq('status', 'erro'),
        supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true }).eq('id_campanha', event.id).eq('status', 'enviado'),
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
        // Fallback to event_messages
        const eb = supabase.from('event_messages').select('*', { count: 'exact', head: true }).eq('event_id', event.id);
        const [
          total2,
          queued2,
          read2,
          responded2,
          error2,
          delivered2
        ] = await Promise.all([
          eb,
          supabase.from('event_messages').select('*', { count: 'exact', head: true }).eq('event_id', event.id).in('status', ['queued','pending','processing']),
          supabase.from('event_messages').select('*', { count: 'exact', head: true }).eq('event_id', event.id).not('read_at', 'is', null),
          supabase.from('event_messages').select('*', { count: 'exact', head: true }).eq('event_id', event.id).not('responded_at', 'is', null),
          supabase.from('event_messages').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('status', 'failed'),
          supabase.from('event_messages').select('*', { count: 'exact', head: true }).eq('event_id', event.id).in('status', ['sent','delivered']),
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
    
    // Filter messages by selected date if provided
    const filteredMessages = selectedDate 
      ? normalizedMessages.filter(message => {
          if (!message.data_envio) return false;
          const messageDate = new Date(message.data_envio);
          const filterDate = new Date(selectedDate);
          return messageDate.toDateString() === filterDate.toDateString();
        })
      : normalizedMessages;
    
    filteredMessages.forEach(message => {
      if (message.data_envio) {
        const hour = new Date(message.data_envio).getHours();
        const hourKey = `${hour.toString().padStart(2, '0')}:00`;
        
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = { enviados: 0, respondidos: 0 };
        }
        
        hourlyData[hourKey].enviados++;
        
        if (message.data_resposta) {
          hourlyData[hourKey].respondidos++;
        }
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
    const statusCounts = new Map();
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