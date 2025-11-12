import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalyticsData } from '@/hooks/useAnalytics';

function getTimeRangeLabelPDF(timeRange: string): string {
  const labels: Record<string, string> = {
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    '90d': 'Últimos 90 dias',
    '1y': 'Último ano',
    'all': 'Todos os períodos',
  };
  return labels[timeRange] || timeRange;
}

function getVariationTextPDF(current: number, previous: number): string {
  if (!previous) return '-';
  const diff = ((current - previous) / previous * 100).toFixed(1);
  return `${current > previous ? '+' : ''}${diff}%`;
}

export async function exportReportToPDF(analytics: AnalyticsData, timeRange: string): Promise<void> {
  const doc = new jsPDF();
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.text('Relatório de Performance', 20, 20);
  doc.setFontSize(12);
  doc.text(`Período: ${getTimeRangeLabelPDF(timeRange)}`, 20, 30);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 37);
  
  let yPosition = 50;
  
  // Métricas Principais
  doc.setFontSize(16);
  doc.text('Métricas Principais', 20, yPosition);
  yPosition += 10;
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Métrica', 'Valor', 'Variação']],
    body: [
      ['Mensagens Enviadas', analytics.totalMessages.toLocaleString(), 
       getVariationTextPDF(analytics.totalMessages, analytics.previousPeriod.totalMessages)],
      ['Taxa de Resposta', `${analytics.responseRate.toFixed(1)}%`,
       getVariationTextPDF(analytics.responseRate, analytics.previousPeriod.responseRate)],
      ['Mensagens Entregues', analytics.deliveredMessagesCount.toLocaleString(),
       getVariationTextPDF(analytics.deliveredMessagesCount, analytics.previousPeriod.deliveredMessagesCount)],
      ['Mensagens Respondidas', analytics.respondedMessagesCount.toLocaleString(),
       getVariationTextPDF(analytics.respondedMessagesCount, analytics.previousPeriod.respondedMessagesCount)],
    ],
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  // Análise de Sentimento
  doc.setFontSize(16);
  doc.text('Análise de Sentimento', 20, yPosition);
  yPosition += 10;
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Sentimento', 'Quantidade', 'Percentual']],
    body: analytics.globalSentiment.distribution.map(s => [
      s.sentiment,
      s.count.toString(),
      `${s.percentage.toFixed(1)}%`
    ]),
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  // Nova página para Geografia (se houver dados)
  if (analytics.geographicData && analytics.geographicData.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(16);
    doc.text('Análise Geográfica - Top 10 Cidades', 20, yPosition);
    yPosition += 10;
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Cidade', 'Contatos', 'Mensagens', 'Respostas', 'Taxa']],
      body: analytics.geographicData.slice(0, 10).map(city => [
        city.cidade,
        city.total_contatos.toString(),
        city.mensagens_enviadas.toString(),
        city.mensagens_respondidas.toString(),
        `${city.taxa_resposta.toFixed(1)}%`
      ]),
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Nova página para Perfis (se houver dados)
  if (analytics.profileAnalysis && analytics.profileAnalysis.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(16);
    doc.text('Análise de Perfil de Contatos', 20, yPosition);
    yPosition += 10;
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Perfil', 'Contatos', 'Taxa Resposta', 'Tempo Médio']],
      body: analytics.profileAnalysis.map(profile => [
        profile.profile,
        profile.total_contatos.toString(),
        `${profile.taxa_resposta.toFixed(1)}%`,
        profile.tempo_medio_resposta ? `${profile.tempo_medio_resposta}min` : 'N/A'
      ]),
    });
  }
  
  // Salvar
  doc.save(`relatorio-${timeRange}-${Date.now()}.pdf`);
}

