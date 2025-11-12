import { supabase } from '@/integrations/supabase/client';
import { AnalyticsData } from '@/hooks/useAnalytics';

const SYSTEM_PROMPT =
  'Você é um estrategista político especializado em comunicação digital no Paraná. Sua função é seguir EXATAMENTE a estrutura fornecida pelo usuário, sem desvios. Use os títulos EXATOS solicitados. Analise dados de WhatsApp focando em engajamento, sentimento da base por região e perfil, e impacto na imagem pública. Use linguagem clara e profissional.';

export async function generateAIAnalysis(analytics: AnalyticsData, timeRange: string): Promise<string> {
  try {
    const prompt = `Você é um estrategista político especializado em comunicação digital no Paraná. 

IMPORTANTE: Você DEVE seguir EXATAMENTE a estrutura abaixo, sem exceções. Use EXATAMENTE esses títulos numerados.

DADOS PARA ANÁLISE:

MÉTRICAS GERAIS:
- Período: ${getTimeRangeLabel(timeRange)}
- Mensagens enviadas: ${analytics.totalMessages.toLocaleString()}
- Taxa de resposta: ${analytics.responseRate.toFixed(1)}%
- Mensagens respondidas: ${analytics.respondedMessagesCount.toLocaleString()}
- Taxa de entrega: ${((analytics.deliveredMessagesCount / analytics.totalMessages) * 100).toFixed(1)}%

SENTIMENTO DOS CONTATOS:
${analytics.globalSentiment.distribution.map(d => `- ${d.sentiment}: ${d.count} (${d.percentage.toFixed(1)}%)`).join('\n')}

TOP 5 CIDADES POR PERFORMANCE:
${analytics.geographicData.slice(0, 5).map(c => `- ${c.cidade}: ${c.taxa_resposta.toFixed(1)}% de resposta (${c.total_contatos} contatos)`).join('\n')}

TOP 5 PERFIS DE CONTATO:
${analytics.profileAnalysis.slice(0, 5).map(p => `- ${p.profile}: ${p.taxa_resposta.toFixed(1)}% de resposta${p.melhor_horario ? `, melhor horário ${p.melhor_horario}` : ''}${p.tempo_medio_resposta ? `, tempo médio ${p.tempo_medio_resposta}min` : ''}`).join('\n')}

MELHOR HORÁRIO DE ENVIO:
${analytics.hourlyActivity.length > 0 ? `- ${analytics.hourlyActivity.reduce((best, current) => current.responses > best.responses ? current : best).hour} (${analytics.hourlyActivity.reduce((best, current) => current.responses > best.responses ? current : best).responses} respostas)` : 'N/A'}

TOP 3 CAMPANHAS:
${analytics.campaignPerformance.slice(0, 3).map(c => `- ${c.name}: ${c.responded} respostas de ${c.sent} enviadas (${((c.responded / c.sent) * 100).toFixed(1)}%)`).join('\n')}

===

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (COPIE EXATAMENTE ESTES TÍTULOS):

1. **VISÃO GERAL**

[Escreva aqui um resumo executivo da performance em 2-3 frases]

2. **PONTOS FORTES**

[Liste exatamente 3 aspectos positivos identificados nos dados, use bullets com -]

3. **OPORTUNIDADES DE MELHORIA**

[Liste exatamente 3 áreas que precisam de atenção, riscos e ajustes de narrativa, use bullets com -]

4. **RECOMENDAÇÕES PRÁTICAS**

[Liste exatamente 5 ações específicas e acionáveis para melhorar os resultados, priorizadas por impacto, use bullets com -]

5. **INSIGHTS ESTRATÉGICOS**

[Liste 2-3 observações sobre padrões interessantes nos dados: horários, perfis, geografia, sentimento e padrões de comportamento do eleitor, use bullets com -]

6. **IMPACTO NA IMAGEM PÚBLICA**

[Forneça uma nota de 1 a 5 e breve justificativa]

===

REGRAS IMPORTANTES:
- Use EXATAMENTE os títulos numerados acima (1. **VISÃO GERAL**, 2. **PONTOS FORTES**, etc.)
- NÃO invente novos títulos ou seções
- NÃO mude a ordem das seções
- Use linguagem clara e profissional
- Máximo 700 palavras
- Seja objetivo e prático`;

    const { data, error } = await supabase.functions.invoke('generate-ai-analysis', {
      body: {
        prompt,
        systemPrompt: SYSTEM_PROMPT,
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 2000,
      },
    });

    if (error) {
      console.error('❌ Erro na função generate-ai-analysis:', error);
      throw new Error(`Erro ao invocar função generate-ai-analysis: ${error.message}`);
    }

    if (!data?.content) {
      throw new Error('Resposta vazia da função generate-ai-analysis');
    }

    return data.content;
  } catch (error) {
    console.error('❌ Erro na análise por IA:', error);
    throw error;
  }
}

function getTimeRangeLabel(timeRange: string): string {
  const labels: Record<string, string> = {
    '7d': 'últimos 7 dias',
    '30d': 'últimos 30 dias',
    '90d': 'últimos 90 dias',
    '1y': 'último ano',
    'all': 'todos os períodos',
  };
  return labels[timeRange] || timeRange;
}

