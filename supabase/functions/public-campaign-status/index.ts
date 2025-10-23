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
    const { campaignId, selectedDate } = await req.json();
    
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
      let query = supabase
        .from('mensagens_enviadas')
        .select('data_envio, data_resposta, status, sentimento')
        .eq('id_campanha', campaignId)
        .order('data_envio', { ascending: true });

      // Apply date filter at database level if selectedDate is provided
      if (selectedDate) {
        // Use the exact local midnight sent by the client (e.g., 03:00Z for BRT)
        const startOfDay = new Date(selectedDate);
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        query = query
          .gte('data_envio', startOfDay.toISOString())
          .lt('data_envio', endOfDay.toISOString());
      }

      const { data: page, error: messagesError } = await query
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
      sentMessages: messages.filter(m => ['enviado', 'erro'].includes((m.status || '').toLowerCase())).length, // enviado + erro
      deliveredMessages: messages.filter(m => (m.status || '').toLowerCase() === 'enviado').length, // apenas enviado
      responseMessages: messages.filter(m => m.data_resposta).length,
      errorMessages: messages.filter(m => (m.status || '').toLowerCase() === 'erro').length,
      queuedMessages: messages.filter(m => ['fila', 'pendente', 'processando'].includes((m.status || '').toLowerCase())).length,
      progressRate: messages.length > 0 ? 
        ((messages.length - messages.filter(m => ['fila', 'pendente', 'processando'].includes((m.status || '').toLowerCase())).length) / messages.length) * 100 : 0,
      responseRate: messages.filter(m => ['enviado', 'erro'].includes((m.status || '').toLowerCase())).length > 0 ?
        (messages.filter(m => m.data_resposta).length / messages.filter(m => ['enviado', 'erro'].includes((m.status || '').toLowerCase())).length) * 100 : 0,
    } : null;

    // Calculate hourly activity
    const hourlyData = new Map();
    for (let i = 0; i < 24; i++) {
      const hour = `${i.toString().padStart(2, '0')}:00`;
      hourlyData.set(hour, { enviados: 0, respondidos: 0 });
    }

    // Process all messages (already filtered by date at database level if selectedDate provided)
    messages?.forEach(message => {
      if (!message.data_envio) return;
      
      // Convert hour to America/Sao_Paulo timezone to match campaigns page
      const hourStr = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(new Date(message.data_envio));
      const hour = Number(hourStr);
      const key = `${hour.toString().padStart(2, '0')}:00`;
      const data = hourlyData.get(key);
      if (!data) return;
      
      // Enviados: todas as mensagens que tentaram ser enviadas (exceto pendente/fila)
      if (!['pendente', 'fila'].includes((message.status || '').toLowerCase())) {
        data.enviados++;
      }
      
      // Respondidos: mensagens que têm data_resposta (baseado no horário de envio)
      if (message.data_resposta) {
        data.respondidos++;
      }
    });

    const hourlyActivity = Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour,
      enviados: data.enviados,
      respondidos: data.respondidos
    })).sort((a, b) => a.hour.localeCompare(b.hour));

    // Calculate sentiment analysis (alinhado com front-end: valores não reconhecidos => sem_classificacao)
    const normalizeSentiment = (sentiment: string | null): 'super_engajado' | 'positivo' | 'neutro' | 'negativo' | null => {
      if (!sentiment) return null;
      const normalized = sentiment.toLowerCase().trim();
      switch (normalized) {
        case 'super engajado':
        case 'super_engajado':
        case 'superengajado':
          return 'super_engajado';
        case 'positivo':
          return 'positivo';
        case 'neutro':
          return 'neutro';
        case 'negativo':
          return 'negativo';
        default:
          return null; // não reconhecido
      }
    };

    const sentimentCounts: Record<string, number> = {
      super_engajado: 0,
      positivo: 0,
      neutro: 0,
      negativo: 0,
      sem_classificacao: 0,
    };

    for (const m of messages || []) {
      const s = normalizeSentiment(m.sentimento ?? null);
      if (s) {
        sentimentCounts[s] = (sentimentCounts[s] || 0) + 1;
      } else {
        sentimentCounts.sem_classificacao = (sentimentCounts.sem_classificacao || 0) + 1;
      }
    }

    const sentimentTotal = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);

    const sentimentDistribution = [
      {
        sentiment: 'Super Engajado',
        count: sentimentCounts['super_engajado'],
        percentage: sentimentTotal > 0 ? (sentimentCounts['super_engajado'] / sentimentTotal) * 100 : 0,
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
      selectedDate: selectedDate || 'all dates',
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
          superEngajado: sentimentCounts['super_engajado'],
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
});
