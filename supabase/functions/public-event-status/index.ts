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

  const processedMessages = analytics.deliveredMessages + analytics.readMessages + analytics.errorMessages;
  
  if (processedMessages < analytics.totalMessages) {
    return 'sending';
  }

  if (analytics.errorMessages > 0 && analytics.deliveredMessages === 0) {
    return 'failed';
  }

  return 'completed';
}

function normalizeStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'fila': 'queued',
    'enviado': 'delivered', 
    'entregue': 'delivered',
    'lido': 'read',
    'respondido': 'responded',
    'erro': 'error',
    'failed': 'error'
  };
  
  return statusMap[status?.toLowerCase()] || status?.toLowerCase() || 'queued';
}

function normalizeSentiment(sentiment: string): string {
  if (!sentiment) return 'neutro';
  
  const sentimentMap: { [key: string]: string } = {
    'super engajado': 'super_engajado',
    'super_engajado': 'super_engajado',
    'engajado': 'super_engajado',
    'positivo': 'positivo',
    'neutro': 'neutro',
    'negativo': 'negativo',
    'desinteressado': 'negativo'
  };
  
  return sentimentMap[sentiment.toLowerCase()] || 'neutro';
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
    
    // Calculate analytics
    const totalMessages = messagesData.length;
    const queuedMessages = messagesData.filter(m => normalizeStatus(m.status) === 'queued').length;
    const deliveredMessages = messagesData.filter(m => normalizeStatus(m.status) === 'delivered').length;
    const readMessages = messagesData.filter(m => normalizeStatus(m.status) === 'read').length;
    const responseMessages = messagesData.filter(m => normalizeStatus(m.status) === 'responded').length;
    const errorMessages = messagesData.filter(m => normalizeStatus(m.status) === 'error').length;

    const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
    const readRate = deliveredMessages > 0 ? (readMessages / deliveredMessages) * 100 : 0;
    const responseRate = readMessages > 0 ? (responseMessages / readMessages) * 100 : 0;
    const progressRate = totalMessages > 0 ? ((totalMessages - queuedMessages) / totalMessages) * 100 : 0;

    // Generate hourly activity data
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
      const hourMessages = messagesData.filter(m => {
        if (!m.data_envio) return false;
        const msgHour = new Date(m.data_envio).getHours();
        return msgHour === hour;
      });

      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        messages: hourMessages.length,
        read: hourMessages.filter(m => m.data_leitura).length,
        responded: hourMessages.filter(m => m.data_resposta).length,
      };
    }).filter(h => h.messages > 0);

    // Generate status distribution
    const statusCounts = {
      queued: queuedMessages,
      delivered: deliveredMessages,
      read: readMessages,
      responded: responseMessages,
      error: errorMessages,
    };

    const statusDistribution = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => {
        const colors = {
          queued: '#6B7280',
          delivered: '#10B981',
          read: '#3B82F6',
          responded: '#8B5CF6',
          error: '#EF4444',
        };
        
        return {
          status,
          count,
          percentage: totalMessages > 0 ? (count / totalMessages) * 100 : 0,
          color: colors[status as keyof typeof colors] || '#6B7280',
        };
      });

    // Generate sentiment analysis
    const sentimentCounts = messagesData.reduce((acc, msg) => {
      if (msg.sentimento) {
        const normalized = normalizeSentiment(msg.sentimento);
        acc[normalized] = (acc[normalized] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const sentimentDistribution = Object.entries(sentimentCounts).map(([sentiment, count]) => {
      const sentimentConfig = {
        super_engajado: { emoji: '🚀', color: '#10B981' },
        positivo: { emoji: '😊', color: '#3B82F6' },
        neutro: { emoji: '😐', color: '#6B7280' },
        negativo: { emoji: '😞', color: '#EF4444' },
      };
      
      const config = sentimentConfig[sentiment as keyof typeof sentimentConfig] || { emoji: '🤔', color: '#6B7280' };
      
      return {
        sentiment,
        count,
        percentage: totalMessages > 0 ? (count / totalMessages) * 100 : 0,
        ...config,
      };
    });

    // Generate profile analysis
    const profileCounts = messagesData.reduce((acc, msg) => {
      if (msg.perfil_contato) {
        acc[msg.perfil_contato] = (acc[msg.perfil_contato] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const profileDistribution = Object.entries(profileCounts).map(([profile, count]) => ({
      profile,
      count,
      percentage: totalMessages > 0 ? (count / totalMessages) * 100 : 0,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
    }));

    const analytics = {
      totalMessages,
      queuedMessages,
      deliveredMessages,
      readMessages,
      responseMessages,
      errorMessages,
      deliveryRate,
      readRate,
      responseRate,
      progressRate,
      hourlyActivity,
      statusDistribution,
      sentimentAnalysis: {
        totalResponses: Object.values(sentimentCounts).reduce((a, b) => a + b, 0),
        distribution: sentimentDistribution,
        positivo: sentimentCounts.positivo || 0,
        negativo: sentimentCounts.negativo || 0,
        neutro: sentimentCounts.neutro || 0,
        super_engajado: sentimentCounts.super_engajado || 0,
      },
      profileAnalysis: {
        distribution: profileDistribution,
      },
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