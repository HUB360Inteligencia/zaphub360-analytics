import * as XLSX from 'xlsx';
import { AnalyticsData } from '@/hooks/useAnalytics';

function getTimeRangeLabel(timeRange: string): string {
  const labels: Record<string, string> = {
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    '90d': 'Últimos 90 dias',
    '1y': 'Último ano',
    'all': 'Todos os períodos',
  };
  return labels[timeRange] || timeRange;
}

function getVariation(current: number, previous: number): string {
  if (!previous) return '-';
  return `${((current - previous) / previous * 100).toFixed(1)}%`;
}

export const exportToExcel = (analytics: AnalyticsData, timeRange: string) => {
  const wb = XLSX.utils.book_new();
  
  // Aba 1: Resumo
  const resumoData = [
    ['Relatório de Performance - Zaphub360 Analytics'],
    ['Período', getTimeRangeLabel(timeRange)],
    ['Gerado em', new Date().toLocaleString('pt-BR')],
    [],
    ['Métrica', 'Valor Atual', 'Período Anterior', 'Variação'],
    ['Mensagens Enviadas', analytics.totalMessages, analytics.previousPeriod.totalMessages,
     getVariation(analytics.totalMessages, analytics.previousPeriod.totalMessages)],
    ['Mensagens Entregues', analytics.deliveredMessagesCount, analytics.previousPeriod.deliveredMessagesCount,
     getVariation(analytics.deliveredMessagesCount, analytics.previousPeriod.deliveredMessagesCount)],
    ['Mensagens Respondidas', analytics.respondedMessagesCount, analytics.previousPeriod.respondedMessagesCount,
     getVariation(analytics.respondedMessagesCount, analytics.previousPeriod.respondedMessagesCount)],
    ['Taxa de Resposta', `${analytics.responseRate.toFixed(1)}%`, 
     `${analytics.previousPeriod.responseRate.toFixed(1)}%`,
     `${(analytics.responseRate - analytics.previousPeriod.responseRate).toFixed(1)}%`],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
  
  // Aba 2: Sentimento
  const sentimentoData = [
    ['Sentimento', 'Quantidade', 'Percentual'],
    ...analytics.globalSentiment.distribution.map(s => [
      s.sentiment, s.count, `${s.percentage.toFixed(1)}%`
    ])
  ];
  const wsSentimento = XLSX.utils.aoa_to_sheet(sentimentoData);
  XLSX.utils.book_append_sheet(wb, wsSentimento, 'Sentimento');
  
  // Aba 3: Geografia
  if (analytics.geographicData && analytics.geographicData.length > 0) {
    const geoData = [
      ['Cidade', 'Total Contatos', 'Mensagens Enviadas', 'Mensagens Respondidas', 'Taxa de Resposta', 'Sentimento Predominante'],
      ...analytics.geographicData.map(city => [
        city.cidade,
        city.total_contatos,
        city.mensagens_enviadas,
        city.mensagens_respondidas,
        `${city.taxa_resposta.toFixed(1)}%`,
        city.sentimento_predominante
      ])
    ];
    const wsGeo = XLSX.utils.aoa_to_sheet(geoData);
    XLSX.utils.book_append_sheet(wb, wsGeo, 'Geografia');
  }
  
  // Aba 4: Perfil
  if (analytics.profileAnalysis && analytics.profileAnalysis.length > 0) {
    const perfilData = [
      ['Perfil', 'Total Contatos', 'Mensagens Enviadas', 'Mensagens Respondidas', 'Taxa de Resposta', 'Tempo Médio Resposta', 'Melhor Horário'],
      ...analytics.profileAnalysis.map(profile => [
        profile.profile,
        profile.total_contatos,
        profile.mensagens_enviadas,
        profile.mensagens_respondidas,
        `${profile.taxa_resposta.toFixed(1)}%`,
        profile.tempo_medio_resposta ? `${profile.tempo_medio_resposta}min` : 'N/A',
        profile.melhor_horario || 'N/A'
      ])
    ];
    const wsPerfil = XLSX.utils.aoa_to_sheet(perfilData);
    XLSX.utils.book_append_sheet(wb, wsPerfil, 'Perfil');
  }
  
  // Aba 5: Performance Diária
  const dailyData = [
    ['Data', 'Mensagens', 'Respostas'],
    ...analytics.dailyActivity.map(day => [
      day.date, day.messages, day.responses
    ])
  ];
  const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
  XLSX.utils.book_append_sheet(wb, wsDaily, 'Performance Diária');
  
  // Aba 6: Campanhas
  const campaignData = [
    ['Campanha', 'Enviadas', 'Entregues', 'Lidas', 'Respondidas', 'Erros'],
    ...analytics.campaignPerformance.map(camp => [
      camp.name,
      camp.sent,
      camp.delivered,
      camp.read,
      camp.responded,
      camp.errors
    ])
  ];
  const wsCamp = XLSX.utils.aoa_to_sheet(campaignData);
  XLSX.utils.book_append_sheet(wb, wsCamp, 'Campanhas');
  
  // Salvar
  XLSX.writeFile(wb, `relatorio-${timeRange}-${Date.now()}.xlsx`);
};

