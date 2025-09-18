import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId } = await req.json();
    
    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Campaign ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign not found:', campaignError);
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // Fetch campaign messages for analytics (paginação p/ passar de 1000)
    const pageSize = 1000;
    let from = 0;
    let to = pageSize - 1;
    let allMessages: any[] = [];

    while (true) {
      const { data: page, error: messagesError } = await supabase
        .from('mensagens_enviadas')
        .select('*')
        .eq('id_campanha', campaignId)
        .range(from, to); // cada chamada traz até 1000

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        break; // ou: throw messagesError;
      }

      if (!page || page.length === 0) break;

      allMessages = allMessages.concat(page);

      if (page.length < pageSize) break; // última página
      from += pageSize;
      to += pageSize;
    }

    const messages = allMessages;
    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    // Calculate analytics
    const analytics = messages ? {
      totalMessages: messages.length,
      sentMessages: messages.filter(m => ['enviado', 'erro'].includes(m.status)).length, // enviado + erro
      deliveredMessages: messages.filter(m => m.status === 'enviado').length, // apenas enviado
      responseMessages: messages.filter(m => m.data_resposta).length,
      errorMessages: messages.filter(m => m.status === 'erro').length,
      queuedMessages: messages.filter(m => ['fila', 'pendente', 'processando'].includes(m.status)).length,
      progressRate: messages.length > 0 ? 
        ((messages.length - messages.filter(m => ['fila', 'pendente', 'processando'].includes(m.status)).length) / messages.length) * 100 : 0,
      responseRate: messages.filter(m => ['enviado', 'erro'].includes(m.status)).length > 0 ?
        (messages.filter(m => m.data_resposta).length / messages.filter(m => ['enviado', 'erro'].includes(m.status)).length) * 100 : 0,
    } : null;

    // Calculate hourly activity
    const hourlyData = new Map();
    for (let i = 0; i < 24; i++) {
      const hour = `${i.toString().padStart(2, '0')}:00`;
      hourlyData.set(hour, { enviados: 0, entregues: 0, respondidos: 0, erros: 0 });
    }

    messages?.forEach(message => {
      if (!message.data_envio) return;
      
      const hour = new Date(message.data_envio).getHours();
      const key = `${hour.toString().padStart(2, '0')}:00`;
      const data = hourlyData.get(key);
      if (!data) return;
      
      // Enviados: todas as mensagens que tentaram ser enviadas (exceto pendente/fila)
      if (!['pendente', 'fila'].includes(message.status)) {
        data.enviados++;
      }
      
      // Entregues: apenas status 'enviado'
      if (message.status === 'enviado') {
        data.entregues++;
      }
      
      // Respondidos: mensagens que têm data_resposta (baseado no horário de envio)
      if (message.data_resposta) {
        data.respondidos++;
      }
      
      // Erros: status 'erro'
      if (message.status === 'erro') {
        data.erros++;
      }
    });

    const hourlyActivity = Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour,
      enviados: data.enviados,
      entregues: data.entregues,
      respondidos: data.respondidos,
      erros: data.erros
    })).sort((a, b) => a.hour.localeCompare(b.hour));

    // Calculate sentiment analysis
    const normalizeSentiment = (sentiment: string | null): string | null => {
      if (!sentiment) return null;
      const normalized = sentiment.toLowerCase().trim();
      switch (normalized) {
        case 'super engajado':
        case 'super_engajado':
        case 'superengajado':
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
    };

    const sentimentCounts = {
      'super engajado': messages?.filter(m => normalizeSentiment(m.sentimento) === 'super engajado').length || 0,
      'positivo': messages?.filter(m => normalizeSentiment(m.sentimento) === 'positivo').length || 0,
      'neutro': messages?.filter(m => normalizeSentiment(m.sentimento) === 'neutro').length || 0,
      'negativo': messages?.filter(m => normalizeSentiment(m.sentimento) === 'negativo').length || 0,
      'sem_classificacao': messages?.filter(m => m.sentimento === null || m.sentimento === undefined).length || 0,
    };

    const sentimentTotal = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);

    const sentimentDistribution = [
      {
        sentiment: 'Super Engajado',
        count: sentimentCounts['super engajado'],
        percentage: sentimentTotal > 0 ? (sentimentCounts['super engajado'] / sentimentTotal) * 100 : 0,
        color: '#FF6B35',
        emoji: '🔥'
      },
      {
        sentiment: 'Positivo',
        count: sentimentCounts['positivo'],
        percentage: sentimentTotal > 0 ? (sentimentCounts['positivo'] / sentimentTotal) * 100 : 0,
        color: '#10B981',
        emoji: '😊'
      },
      {
        sentiment: 'Neutro',
        count: sentimentCounts['neutro'],
        percentage: sentimentTotal > 0 ? (sentimentCounts['neutro'] / sentimentTotal) * 100 : 0,
        color: '#6B7280',
        emoji: '😐'
      },
      {
        sentiment: 'Negativo',
        count: sentimentCounts['negativo'],
        percentage: sentimentTotal > 0 ? (sentimentCounts['negativo'] / sentimentTotal) * 100 : 0,
        color: '#EF4444',
        emoji: '😞'
      },
      {
        sentiment: 'Sem Classificação',
        count: sentimentCounts['sem_classificacao'],
        percentage: sentimentTotal > 0 ? (sentimentCounts['sem_classificacao'] / sentimentTotal) * 100 : 0,
        color: '#D1D5DB',
        emoji: '⚪'
      }
    ];

    // Debug logs
    console.log('Public campaign analytics debug:', {
      totalMessages: analytics?.totalMessages,
      sentMessages: analytics?.sentMessages,
      deliveredMessages: analytics?.deliveredMessages,
      responseMessages: analytics?.responseMessages,
      errorMessages: analytics?.errorMessages
    });

    const responseData = {
      ...campaign,
      analytics: {
        ...analytics,
        hourlyActivity,
        sentimentAnalysis: {
          superEngajado: sentimentCounts['super engajado'],
          positivo: sentimentCounts['positivo'],
          neutro: sentimentCounts['neutro'],
          negativo: sentimentCounts['negativo'],
          semClassificacao: sentimentCounts['sem_classificacao'],
          distribution: sentimentDistribution
        }
      }
    };

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in public-campaign-status function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
