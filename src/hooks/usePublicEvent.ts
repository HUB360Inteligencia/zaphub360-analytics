import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- 1) Receber o body com segurança + log leve ---
    let payload: any = {};
    try {
      payload = await req.json();
    } catch (_) {
      payload = {};
    }
    const campaignId = payload?.campaignId;

    // Permite debug: /public-campaign-status?debug=1
    const url = new URL(req.url);
    const DEBUG = url.searchParams.get("debug") === "1";

    if (!campaignId) {
      return new Response(JSON.stringify({ error: "Campaign ID is required", debug: { payload } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 2) Cliente Supabase (confira se é o mesmo projeto do seu app) ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Sanidade opcional: conta quantas campaigns existem
    const { count: campaignsCount, error: countErr } = await supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true });

    // --- 3) Buscar campanha (tente por id uuid) ---
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      // Resposta de diagnóstico para sabermos o motivo real
      return new Response(
        JSON.stringify({
          error: "Campaign not found",
          debug: {
            campaignId,
            supabaseUrl,
            campaignsCount,
            countErr: countErr?.message ?? null,
            campaignError: campaignError?.message ?? null,
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Helper para contagem sem baixar linhas
    const countQuery = async (qb: ReturnType<typeof supabase.from>) => {
      const { count, error } = await qb.select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    };

    // --- 4) Contagens (sem limite de 1000) ---
    const [
      totalMessages,
      queuedMessages,
      sentMessages,
      deliveredMessages,
      responseMessages,
      errorMessages,
    ] = await Promise.all([
      countQuery(supabase.from("mensagens_enviadas").eq("id_campanha", campaignId)),
      countQuery(
        supabase
          .from("mensagens_enviadas")
          .eq("id_campanha", campaignId)
          .in("status", ["fila", "pendente", "processando"])
      ),
      countQuery(supabase.from("mensagens_enviadas").eq("id_campanha", campaignId).eq("status", "enviado")),
      countQuery(supabase.from("mensagens_enviadas").eq("id_campanha", campaignId).not("data_leitura", "is", null)),
      countQuery(supabase.from("mensagens_enviadas").eq("id_campanha", campaignId).not("data_resposta", "is", null)),
      countQuery(supabase.from("mensagens_enviadas").eq("id_campanha", campaignId).eq("status", "erro")),
    ]);

    const analytics = {
      totalMessages,
      queuedMessages,
      sentMessages,
      deliveredMessages,
      responseMessages,
      errorMessages,
      progressRate: totalMessages > 0 ? ((totalMessages - queuedMessages) / totalMessages) * 100 : 0,
      responseRate: deliveredMessages > 0 ? (responseMessages / deliveredMessages) * 100 : 0,
    };

    // --- 5) Resposta final ---
    const responseData = { ...campaign, analytics, ...(DEBUG ? { debug: { supabaseUrl } } : {}) };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Internal server error", message: err?.message ?? String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
