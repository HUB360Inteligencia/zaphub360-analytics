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

    // If not in query params, try to get from request body
    if (!eventId && req.method === 'POST') {
      try {
        const body = await req.json();
        eventId = body.eventId;
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
        .select('status, created_at as data_envio, sentiment as sentimento, contact_profile as perfil_contato')
        .eq('event_id', event.id);

      if (messages2 && messages2.length > 0) {
        messagesData = messages2.map(msg => ({
          status: msg.status,
          data_envio: msg.data_envio,
          data_leitura: null, // event_messages doesn't track read status separately
          data_resposta: null, // event_messages doesn't track response separately
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

    // Calculate analytics matching private page logic
    const totalMessages = normalizedMessages.length;
    const queuedMessages = normalizedMessages.filter(m => m.status === 'fila').length;
    const readMessages = normalizedMessages.filter(m => m.status === 'lido').length;
    // Improved response counting: status 'respondido' OR data_resposta exists
    const responseMessages = normalizedMessages.filter(m => 
      m.status === 'respondido' || m.data_resposta != null
    ).length;
    const errorMessages = normalizedMessages.filter(m => m.status === 'erro').length;
    
    // Delivered = enviado + lido (matching private page)
    const deliveredMessages = normalizedMessages.filter(m => 
      m.status === 'enviado' || m.status === 'lido'
    ).length;

    // Progress = total - queued
    const progressMessages = normalizedMessages.filter(m => m.status !== 'fila').length;
    const progressRate = totalMessages > 0 ? (progressMessages / totalMessages) * 100 : 0;
    
    const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
    const readRate = deliveredMessages > 0 ? (readMessages / deliveredMessages) * 100 : 0;
    // Improved response rate: fallback to total if no reads
    const responseRate = readMessages > 0 ? (responseMessages / readMessages) * 100 : 
                        (totalMessages > 0 ? (responseMessages / totalMessages) * 100 : 0);
    
    // Log analytics for debugging
    console.log('Public analytics calculated:', {
      totalMessages, queuedMessages, deliveredMessages, readMessages, 
      responseMessages, errorMessages, deliveryRate, readRate, responseRate, progressRate
    });

    // Calculate hourly activity matching private page format
    const hourlyData = new Map();
    
    // Initialize all hours with 0
    for (let i = 0; i < 24; i++) {
      const hour = `${i.toString().padStart(2, '0')}:00`;
      hourlyData.set(hour, { envio: 0, leitura: 0, resposta: 0 });
    }

    // Process message data by actual timestamps
    normalizedMessages.forEach(message => {
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

    // Calculate status distribution with exact colors from private page
    const statusCounts = new Map();
    normalizedMessages.forEach(message => {
      const status = message.status || 'fila';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });

    const statusColors = {
      fila: '#6B7280',
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
    const profileColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];
    
    const profileDistribution = Object.entries(profileCounts).map(([profile, count], index) => ({
      profile,
      count,
      percentage: profileTotal > 0 ? (count / profileTotal) * 100 : 0,
      color: profileColors[index % profileColors.length]
    }));

    const profileAnalysis = {
      distribution: profileDistribution
    };

    const analytics = {
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