import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId } = await req.json().catch(() => ({} as any));
    if (!campaignId) {
      return new Response(JSON.stringify({ error: "Campaign ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Supabase client (Edge Function → use service role)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1) Campanha
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper para contagem (SEM baixar linhas)
    const countQuery = async (qb: ReturnType<typeof supabase.from>) => {
      const { count, error } = await qb.select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    };

    // 2) Contadores paralelos (evita limite de 1000 e é rápido)
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
      countQuery(
        supabase.from("mensagens_enviadas").eq("id_campanha", campaignId).eq("status", "enviado")
      ),
      countQuery(
        supabase.from("mensagens_enviadas").eq("id_campanha", campaignId).not("data_leitura", "is", null)
      ),
      countQuery(
        supabase.from("mensagens_enviadas").eq("id_campanha", campaignId).not("data_resposta", "is", null)
      ),
      countQuery(
        supabase.from("mensagens_enviadas").eq("id_campanha", campaignId).eq("status", "erro")
      ),
    ]);

    const progressRate =
      totalMessages > 0 ? ((totalMessages - queuedMessages) / totalMessages) * 100 : 0;
    const responseRate =
      deliveredMessages > 0 ? (responseMessages / deliveredMessages) * 100 : 0;

    const analytics = {
      totalMessages,
      queuedMessages,
      sentMessages,
      deliveredMessages,
      responseMessages,
      errorMessages,
      progressRate,
      responseRate,
    };

    // 3) Resposta final
    const responseData = { ...campaign, analytics };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("public-campaign-status error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
