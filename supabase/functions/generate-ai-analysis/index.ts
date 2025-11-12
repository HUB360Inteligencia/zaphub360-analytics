import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.5?dts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function getOpenAIKey(): Promise<string> {
  const { data, error } = await supabase
    .from("private_settings")
    .select("value")
    .eq("key", "openai_api_key")
    .single();

  if (error) {
    console.error("Erro ao buscar chave na tabela private_settings:", error);
    throw new Error("Falha ao obter chave OpenAI no Supabase");
  }

  if (!data?.value) {
    throw new Error("Chave OpenAI não encontrada na tabela private_settings");
  }

  return data.value;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = await getOpenAIKey();

    const {
      prompt,
      systemPrompt,
      model = "gpt-4o",
      temperature = 0.3,
      max_tokens = 2000,
    } = await req.json();

    if (!prompt || !systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Corpo da requisição inválido" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resposta da OpenAI não OK:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Falha ao chamar OpenAI",
          status: response.status,
        }),
        { status: 502, headers: corsHeaders },
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Resposta da OpenAI vazia" }),
        { status: 502, headers: corsHeaders },
      );
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na função generate-ai-analysis:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});


