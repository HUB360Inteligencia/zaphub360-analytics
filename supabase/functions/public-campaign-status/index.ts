import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { campaignId, selectedDate, orgSlug, campaignSlug } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let campaign: any = null;

    // Try to find campaign by orgSlug + campaignSlug first
    if (orgSlug && campaignSlug) {
      console.log('Finding campaign by orgSlug:', orgSlug, 'campaignSlug:', campaignSlug);
      
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

      // Get campaign by organization_id and slug
      const { data: campaignBySlug, error: campaignSlugError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', org.id)
        .eq('slug', campaignSlug)
        .single();

      if (campaignSlugError || !campaignBySlug) {
        console.error('Campaign not found by slug:', campaignSlugError);
        return new Response(
          JSON.stringify({ error: 'Campaign not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      campaign = campaignBySlug;
    } else if (campaignId) {
      // Fallback: Fetch campaign by UUID id
      console.log('Fetching campaign with ID:', campaignId);

      const { data: campaignById, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaignById) {
        console.error('Campaign not found:', campaignError);
        return new Response(
          JSON.stringify({ error: 'Campaign not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      campaign = campaignById;
    } else {
      return new Response(
        JSON.stringify({ error: 'Campaign ID or slugs required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Campaign found:', campaign.name);

    // Fetch campaign messages with pagination
    const pageSize = 1000;
    let from = 0;
    let to = pageSize - 1;
    let allMessages: any[] = [];

    while (true) {
      let query = supabase
        .from('mensagens_enviadas')
        .select('data_envio, data_resposta, status, sentimento')
        .eq('id_campanha', campaign.id)
        .order('data_envio', { ascending: true });

      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        query = query
          .gte('data_envio', startOfDay.toISOString())
          .lt('data_envio', endOfDay.toISOString());
      }

      const { data: page, error: messagesError } = await query.range(from, to);

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        break;
      }

      if (!page || page.length === 0) break;

      allMessages = allMessages.concat(page);

      if (page.length < pageSize) break;
      from += pageSize;
      to += pageSize;
    }

    const messages = allMessages;

    // Calculate analytics
    const analytics = messages ? {
      totalMessages: messages.length,
      sentMessages: messages.filter(m => ['enviado', 'erro'].includes((m.status || '').toLowerCase())).length,
      deliveredMessages: messages.filter(m => (m.status || '').toLowerCase() === 'enviado').length,
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

    messages?.forEach(message => {
      if (!message.data_envio) return;
      
      const hourStr = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(new Date(message.data_envio));
      const hour = Number(hourStr);
      const key = `${hour.toString().padStart(2, '0')}:00`;
      const data = hourlyData.get(key);
      if (!data) return;
      
      if (!['pendente', 'fila'].includes((message.status || '').toLowerCase())) {
        data.enviados++;
      }
      
      if (message.data_resposta) {
        data.respondidos++;
      }
    });

    const hourlyActivity = Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour,
      enviados: data.enviados,
      respondidos: data.respondidos
    })).sort((a, b) => a.hour.localeCompare(b.hour));

    // Sentiment analysis
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
          return null;
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
      { sentiment: 'Super Engajado', count: sentimentCounts['super_engajado'], percentage: sentimentTotal > 0 ? (sentimentCounts['super_engajado'] / sentimentTotal) * 100 : 0, color: '#FF6B35', emoji: '🔥' },
      { sentiment: 'Positivo', count: sentimentCounts['positivo'], percentage: sentimentTotal > 0 ? (sentimentCounts['positivo'] / sentimentTotal) * 100 : 0, color: '#10B981', emoji: '😊' },
      { sentiment: 'Neutro', count: sentimentCounts['neutro'], percentage: sentimentTotal > 0 ? (sentimentCounts['neutro'] / sentimentTotal) * 100 : 0, color: '#6B7280', emoji: '😐' },
      { sentiment: 'Negativo', count: sentimentCounts['negativo'], percentage: sentimentTotal > 0 ? (sentimentCounts['negativo'] / sentimentTotal) * 100 : 0, color: '#EF4444', emoji: '😞' },
      { sentiment: 'Sem Classificação', count: sentimentCounts['sem_classificacao'], percentage: sentimentTotal > 0 ? (sentimentCounts['sem_classificacao'] / sentimentTotal) * 100 : 0, color: '#D1D5DB', emoji: '⚪' }
    ];

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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in public-campaign-status function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
