import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { AnalyticsData } from '@/hooks/useAnalytics';

interface ChartElement {
  element: HTMLElement;
  title: string;
  height?: number;
}

// Logo em Base64 (fallback caso não consiga carregar)
const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const PDF_THEME = {
  colors: {
    primary: '#2563EB',
    primarySoft: '#DBEAFE',
    text: '#0F172A',
    mutedText: '#475569',
    border: '#E2E8F0',
    cardShadow: 'rgba(15, 23, 42, 0.06)',
    positive: '#22C55E',
    warning: '#F97316',
    danger: '#EF4444',
    neutral: '#94A3B8'
  },
  layout: {
    page: { width: 210, height: 297 },
    margin: { x: 15, top: 20, bottom: 20 },
    header: { height: 42 },
    footer: { height: 18 },
    content: { left: 18, right: 195, width: 177 },
    card: { radius: 8, padding: 8 },
    chartCard: { height: 96 },
    gap: 6
  },
  fonts: {
    header: { family: 'helvetica', weight: 'bold', size: 16 as const },
    subtitle: { family: 'helvetica', weight: 'normal', size: 10 as const },
    body: { family: 'helvetica', weight: 'normal', size: 10 as const }
  }
};

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

async function loadLogoAsBase64(): Promise<string> {
  try {
    const response = await fetch('/logo.png');
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erro ao carregar logo:', error);
    return LOGO_BASE64; // Fallback
  }
}

async function captureChart(element: HTMLElement, maxWidth: number = 180): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.height / img.width;
        const width = Math.min(maxWidth, img.width / 4);
        const height = width * aspectRatio;
        resolve({ dataUrl, width, height });
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch (error) {
    console.error('Erro ao capturar gráfico:', error);
    return null;
  }
}

interface HeaderOptions {
  title: string;
  subtitle: string;
  logoBase64: string;
  organizationName?: string;
  isFirstPage?: boolean;
}

async function renderHeader(doc: jsPDF, options: HeaderOptions) {
  const { title, subtitle, logoBase64, organizationName, isFirstPage } = options;
  const { page, header, margin } = PDF_THEME.layout;
  const { primary, mutedText, border } = PDF_THEME.colors;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, page.width, header.height, 'F');

  const logoHeight = isFirstPage ? 26 : 22;
  const logoY = margin.top / 2;

  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = logoBase64;
    });

    const aspectRatio = img.width / img.height;
    const logoWidth = logoHeight * aspectRatio;
    doc.addImage(logoBase64, 'PNG', margin.x, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.error('Erro ao adicionar logo:', error);
    doc.addImage(logoBase64, 'PNG', margin.x, logoY, 24, logoHeight);
  }

  const centerX = page.width / 2;
  const titleY = logoY + 6;
  const subtitleY = titleY + 9;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_THEME.colors.text);
  doc.setFontSize(isFirstPage ? 18 : 16);
  doc.text(title, centerX, titleY, { align: 'center', baseline: 'middle' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText);
  doc.setFontSize(10);
  doc.text(subtitle, centerX, subtitleY, { align: 'center' });

  if (organizationName) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary);
    doc.setFontSize(11);
    doc.text(organizationName, page.width - margin.x, titleY, { align: 'right', baseline: 'middle' });
  }

  doc.setDrawColor(border);
  doc.setLineWidth(0.5);
  doc.line(margin.x, header.height - 3, page.width - margin.x, header.height - 3);
}

function addFooter(doc: jsPDF, pageNum: number) {
  const pageHeight = doc.internal.pageSize.height;
  
  // Linha superior do rodapé
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(PDF_THEME.layout.margin.x, pageHeight - PDF_THEME.layout.footer.height, PDF_THEME.layout.page.width - PDF_THEME.layout.margin.x, pageHeight - PDF_THEME.layout.footer.height);
  
  // Texto do rodapé
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.text(`Página ${pageNum}`, 15, pageHeight - 10);
  
  const dateText = `Gerado em ${new Date().toLocaleString('pt-BR')}`;
  doc.text(dateText, 105, pageHeight - 10, { align: 'center' });
  
  doc.setFont('helvetica', 'italic');
  doc.text('Zaphub360 - Comunicação Inteligente', 195, pageHeight - 10, { align: 'right' });
}

interface MetricCard {
  label: string;
  value: string;
  accentColor: string;
  secondary?: { text: string; color?: [number, number, number] };
}

function formatDelta(current: number, previous?: number): { text: string; color: [number, number, number] } | null {
  if (previous === undefined || previous === null) {
    return null;
  }
  if (previous === 0) {
    if (current === 0) {
      return { text: 'Sem variação vs. período anterior', color: hexToRgb(PDF_THEME.colors.mutedText) };
    }
    return { text: 'Sem base de comparação disponível', color: hexToRgb(PDF_THEME.colors.mutedText) };
  }
  const delta = ((current - previous) / previous) * 100;
  const formatted = `${delta >= 0 ? '+' : ''}${delta.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}% vs período anterior`;
  const color = delta >= 0 ? hexToRgb(PDF_THEME.colors.positive) : hexToRgb(PDF_THEME.colors.danger);
  return { text: formatted, color };
}

function drawMetricCard(doc: jsPDF, card: MetricCard, x: number, y: number, width: number, height: number) {
  const radius = PDF_THEME.layout.card.radius;
  const padding = PDF_THEME.layout.card.padding;
  const [accentR, accentG, accentB] = hexToRgb(card.accentColor);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(x + 0.8, y + 1.4, width, height, radius, radius, 'F');

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, width, height, radius, radius, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(PDF_THEME.colors.mutedText);
  doc.text(card.label.toUpperCase(), x + padding, y + 10);

  doc.setFillColor(accentR, accentG, accentB);
  doc.circle(x + width - padding, y + 10, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(PDF_THEME.colors.text);
  doc.text(card.value, x + padding, y + 25);

  if (card.secondary) {
    const [sr, sg, sb] = card.secondary.color ?? hexToRgb(PDF_THEME.colors.mutedText);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(sr, sg, sb);
    doc.text(card.secondary.text, x + padding, y + 36);
  }
}

function drawMetricCards(doc: jsPDF, cards: MetricCard[], originX: number, originY: number, contentWidth: number): number {
  const columns = 2;
  const gap = PDF_THEME.layout.gap;
  const cardWidth = (contentWidth - gap) / columns;
  const cardHeight = 48;

  cards.forEach((card, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = originX + column * (cardWidth + gap);
    const y = originY + row * (cardHeight + gap);
    drawMetricCard(doc, card, x, y, cardWidth, cardHeight);
  });

  const rows = Math.ceil(cards.length / columns);
  return rows * cardHeight + Math.max(0, rows - 1) * gap;
}

interface ChartCard {
  title: string;
  element: HTMLElement;
}

async function drawChartGrid(
  doc: jsPDF,
  cards: ChartCard[],
  originX: number,
  originY: number,
  contentWidth: number
): Promise<number> {
  const columns = 2;
  const gap = PDF_THEME.layout.gap;
  const cardWidth = (contentWidth - gap) / columns;
  const cardHeight = PDF_THEME.layout.chartCard.height;
  const padding = 10;

  let processed = 0;

  for (const card of cards) {
    const column = processed % columns;
    const row = Math.floor(processed / columns);
    const x = originX + column * (cardWidth + gap);
    const y = originY + row * (cardHeight + gap);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x + 0.8, y + 1.4, cardWidth, cardHeight, 6, 6, 'F');

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, cardWidth, cardHeight, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(PDF_THEME.colors.text);
    doc.text(card.title, x + padding, y + 14);

    const chartAreaHeight = cardHeight - padding - 18;
    const chartAreaWidth = cardWidth - padding * 2;

    const captured = await captureChart(card.element, chartAreaWidth);
    if (captured) {
      const scale = Math.min(chartAreaWidth / captured.width, chartAreaHeight / captured.height);
      const drawWidth = captured.width * scale;
      const drawHeight = captured.height * scale;
      const chartX = x + padding + (chartAreaWidth - drawWidth) / 2;
      const chartY = y + 18 + (chartAreaHeight - drawHeight) / 2;
      doc.addImage(captured.dataUrl, 'PNG', chartX, chartY, drawWidth, drawHeight);
    }

    processed++;
  }

  const rows = Math.ceil(processed / columns);
  return rows * cardHeight + Math.max(0, rows - 1) * gap;
}

function collapseSoftBreaks(s: string): string {
  return s
    .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, '')
    .replace(/([^\n])\n(?!\n)/g, '$1 ')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

function formatAIAnalysis(text: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  
  // Normalizar quebras de linha e marcadores antes de extrair seções
  let normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/^[ \t]*([•▪→‣·])\s+/gm, '- ')
    .replace(/^[ \t]*-\s+/gm, '- ')
    .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, '')
    .replace(/[ \t]+$/gm, '');

  // Tenta múltiplos padrões de regex para capturar seções numeradas com títulos em negrito
  // Formato esperado: "1. **VISÃO GERAL**" ou variações
  const patterns = [
    /(\d+)\.\s*\*\*([A-ZÀ-Ú\s]+)\*\*/g,
    /(\d+)\.\s*\*\*([^*\n]+)\*\*/g,
    /(\d+)\.\s+([A-ZÀ-Ú\s]{5,})/g,
  ];
  
  let matches: RegExpMatchArray[] | null = null;
  
  // Tenta cada padrão até encontrar pelo menos 3 seções
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const testMatches = Array.from(normalizedText.matchAll(pattern));
    if (testMatches.length >= 3) {
      matches = testMatches;
      break;
    }
  }
  
  if (matches && matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = match[2].trim().toUpperCase();
      
      // Encontrar o conteúdo entre esta seção e a próxima
      const startIdx = match.index! + match[0].length;
      const endIdx = i < matches.length - 1 ? matches[i + 1].index! : normalizedText.length;
      let content = normalizedText.substring(startIdx, endIdx);

      // Limpar markdown e símbolos, preservando estrutura
      content = content
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .replace(/\[Escreva aqui[^\]]*\]/gi, '')
        .replace(/\[Liste[^\]]*\]/gi, '')
        .replace(/\[Forneça[^\]]*\]/gi, '')
        .replace(/\n{3,}/g, '\n\n');

      // Normalizar espaços preservando quebras de linha
      const normalizedLines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      content = normalizedLines.join('\n').trim();
      
      if (content && content.length > 5) {
        sections.push({ title, content });
      }
    }
  }
  
  // Fallback: se não encontrou seções estruturadas, retorna texto limpo
  if (sections.length === 0) {
    const cleanText = normalizedText
      .replace(/[#*]/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n')
      .trim();
    return [{ title: 'ANALISE INTELIGENTE', content: cleanText }];
  }
  
  return sections;
}

export async function exportAdvancedReportToPDF(
  analytics: AnalyticsData,
  timeRange: string,
  charts: {
    dailyPerformance?: HTMLElement;
    hourlyActivity?: HTMLElement;
    sentimentGlobal?: HTMLElement;
    segmentation?: HTMLElement;
  },
  aiAnalysis?: string,
  organizationName?: string
): Promise<void> {
  const doc = new jsPDF();
  let currentPage = 1;
  
  // Carregar logo
  const logoBase64 = await loadLogoAsBase64();

  // Página 1: Capa e Métricas
  await renderHeader(doc, {
    title: 'Zaphub360 Analytics',
    subtitle: 'Relatório Completo de Performance',
    logoBase64,
    organizationName,
    isFirstPage: true
  });
  
  const headerOffset = PDF_THEME.layout.header.height + 12;
  let yPos = headerOffset;
  const { left: contentLeft, right: contentRight, width: contentWidth } = PDF_THEME.layout.content;
  const bulletIndent = 6;
  
  // Info do período (SEM EMOJI)
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${getTimeRangeLabel(timeRange)}`, contentLeft, yPos);
  yPos += 10;

  // Título da seção
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text('Métricas Principais', contentLeft, yPos);
  yPos += 8;

  // Cards de métricas (2 colunas, 2 linhas)
  const deltaSent = formatDelta(analytics.totalMessages, analytics.previousPeriod?.totalMessages);
  const deltaResponded = formatDelta(analytics.respondedMessagesCount, analytics.previousPeriod?.respondedMessagesCount);
  const deltaRate = formatDelta(analytics.responseRate, analytics.previousPeriod?.responseRate);

  const metricCards: MetricCard[] = [
    {
      label: 'Mensagens Enviadas',
      value: analytics.totalMessages.toLocaleString('pt-BR'),
      accentColor: PDF_THEME.colors.primary,
      secondary: deltaSent ?? undefined,
    },
    {
      label: 'Mensagens Entregues',
      value: analytics.deliveredMessagesCount.toLocaleString('pt-BR'),
      accentColor: PDF_THEME.colors.positive,
      secondary: analytics.errorMessagesCount > 0
        ? { text: `${analytics.errorMessagesCount.toLocaleString('pt-BR')} mensagens com erro`, color: hexToRgb(PDF_THEME.colors.warning) }
        : undefined,
    },
    {
      label: 'Mensagens Respondidas',
      value: analytics.respondedMessagesCount.toLocaleString('pt-BR'),
      accentColor: PDF_THEME.colors.primary,
      secondary: deltaResponded ?? undefined,
    },
    {
      label: 'Taxa de Resposta',
      value: `${analytics.responseRate.toFixed(1)}%`,
      accentColor: PDF_THEME.colors.primary,
      secondary: deltaRate ?? undefined,
    },
  ];

  const metricsHeight = drawMetricCards(doc, metricCards, contentLeft, yPos, contentWidth);
  yPos += metricsHeight + PDF_THEME.layout.gap;

  const chartCards: ChartCard[] = [];
  if (charts.dailyPerformance) {
    chartCards.push({ title: 'Performance Diária', element: charts.dailyPerformance });
  }
  if (charts.hourlyActivity) {
    chartCards.push({ title: 'Atividade por Horário', element: charts.hourlyActivity });
  }
  if (charts.sentimentGlobal) {
    chartCards.push({ title: 'Sentimento Global', element: charts.sentimentGlobal });
  }
  if (charts.segmentation) {
    chartCards.push({ title: 'Segmentação de Contatos', element: charts.segmentation });
  }

  if (chartCards.length > 0) {
    const rows = Math.ceil(chartCards.length / 2);
    const estimatedHeight = rows * PDF_THEME.layout.chartCard.height + Math.max(0, rows - 1) * PDF_THEME.layout.gap;
    const pageHeight = doc.internal.pageSize.height;
    const footerMargin = PDF_THEME.layout.footer.height + 7;

    if (yPos + estimatedHeight > pageHeight - footerMargin) {
      addFooter(doc, currentPage);
      doc.addPage();
      currentPage++;
      await renderHeader(doc, {
        title: 'Zaphub360 Analytics',
        subtitle: 'Relatório Completo de Performance',
        logoBase64,
        organizationName
      });
      yPos = 35;
    }

    const chartsHeight = await drawChartGrid(doc, chartCards, contentLeft, yPos, contentWidth);
    yPos += chartsHeight + PDF_THEME.layout.gap;
  }

  // Análise por IA (formatada) - começar na mesma página se houver espaço
  if (aiAnalysis) {
    const sections = formatAIAnalysis(aiAnalysis);
    const lineHeight = 5.8;

    // Título da seção IA
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.setFont('helvetica', 'bold');
    doc.text('Análise Inteligente', contentLeft, yPos);
    yPos += 8;
    
    const pageHeight = doc.internal.pageSize.height;
    const footerMargin = PDF_THEME.layout.footer.height + 7;

    for (const section of sections) {
      const titleHeight = 10;
      section.content = collapseSoftBreaks(section.content);

      const paragraphData: { isBullet: boolean; lines: string[] }[] = [];
      let paragraphBuffer: string[] = [];

      const flushBuffer = () => {
        if (paragraphBuffer.length === 0) return;
        const text = paragraphBuffer.join(' ');
        const lines = doc.splitTextToSize(text, contentWidth);
        if (lines.length > 0) paragraphData.push({ isBullet: false, lines });
        paragraphBuffer = [];
      };

      section.content.split('\n').forEach((rawLine) => {
        const line = rawLine.replace(/\s+$/g, '');
        if (line.trim().length === 0) { flushBuffer(); return; }

        if (/^- /.test(line.trim())) {
          flushBuffer();
          const bulletText = line.trim().slice(2).trim();
          const lines = doc.splitTextToSize(bulletText, contentWidth - bulletIndent);
          if (lines.length > 0) paragraphData.push({ isBullet: true, lines });
        } else {
          paragraphBuffer.push(line.trim());
        }
      });

      flushBuffer();
      
      const contentHeight = paragraphData.reduce((acc, { lines }) => {
        if (lines.length === 0) return acc;
        return acc + (lines.length * lineHeight) + 2; // 2mm de espaço entre parágrafos
      }, 0);
      
      const sectionTotalHeight = titleHeight + contentHeight + 6; // buffer adicional
      
      // Verificar se há espaço suficiente na página atual
      if (yPos + sectionTotalHeight > pageHeight - footerMargin) {
        addFooter(doc, currentPage);
        doc.addPage();
        currentPage++;
        await renderHeader(doc, {
          title: 'Zaphub360 Analytics',
          subtitle: 'Relatório Completo de Performance',
          logoBase64,
          organizationName
        });
        yPos = headerOffset;
      }
      
      // Título da seção com fundo
      const [boxR, boxG, boxB] = hexToRgb(PDF_THEME.colors.primarySoft);
      doc.setFillColor(boxR, boxG, boxB);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(contentLeft, yPos - 4, contentWidth, 10, 3, 3, 'FD');
      
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, contentLeft, yPos + 3);
      yPos += 12;
      
      // Conteúdo - configurar fonte e spacing
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      doc.setCharSpace(0); // Garantir que não há spacing extra entre caracteres
      
      for (let paragraphIndex = 0; paragraphIndex < paragraphData.length; paragraphIndex++) {
        const { isBullet, lines } = paragraphData[paragraphIndex];

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          if (yPos > pageHeight - footerMargin) {
            addFooter(doc, currentPage);
            doc.addPage();
            currentPage++;
            await renderHeader(doc, {
              title: 'Zaphub360 Analytics',
              subtitle: 'Relatório Completo de Performance',
              logoBase64,
              organizationName
            });
        yPos = headerOffset;
            yPos = headerOffset;
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            doc.setFont('helvetica', 'normal');
            doc.setCharSpace(0);
          }
          
          const isFirstLine = lineIndex === 0;
          const xOffset = isBullet
            ? (isFirstLine ? contentLeft : contentLeft + bulletIndent)
            : contentLeft;
          
          const textToRender = isBullet
            ? (isFirstLine ? `- ${lines[lineIndex]}` : lines[lineIndex])
            : lines[lineIndex];
          
          doc.text(textToRender.replace(/\s+$/g, ''), xOffset, yPos);
          yPos += lineHeight;
        }

        if (paragraphIndex < paragraphData.length - 1) {
          yPos += 2; // espaço entre parágrafos
        }
      }
      
      yPos += 4; // Espaço extra após cada seção
    }
  }
  
  addFooter(doc, currentPage);

  // Tabelas (com estilo melhorado)
  const tableStyles = {
    headStyles: {
      fillColor: [37, 99, 235] as [number, number, number],
      textColor: 255,
      fontStyle: 'bold' as const,
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250] as [number, number, number],
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50] as [number, number, number],
    },
    margin: { top: 45 },
  };

  if (analytics.geographicData.length > 0) {
    doc.addPage();
    currentPage++;
    await renderHeader(doc, {
      title: 'Zaphub360 Analytics',
      subtitle: 'Relatório Completo de Performance',
      logoBase64,
      organizationName
    });
    
    autoTable(doc, {
      ...tableStyles,
      startY: headerOffset,
      head: [['Cidade', 'Contatos', 'Mensagens', 'Respostas', 'Taxa']],
      body: analytics.geographicData.slice(0, 10).map(city => [
        city.cidade,
        city.total_contatos.toLocaleString(),
        city.mensagens_enviadas.toLocaleString(),
        city.mensagens_respondidas.toLocaleString(),
        `${city.taxa_resposta.toFixed(1)}%`
      ]),
    });
    
    addFooter(doc, currentPage);
  }

  if (analytics.profileAnalysis.length > 0) {
    doc.addPage();
    currentPage++;
    await renderHeader(doc, {
      title: 'Zaphub360 Analytics',
      subtitle: 'Relatório Completo de Performance',
      logoBase64,
      organizationName
    });
    
    autoTable(doc, {
      ...tableStyles,
      startY: headerOffset,
      head: [['Perfil', 'Contatos', 'Taxa Resposta', 'Tempo Medio', 'Melhor Horario']],
      body: analytics.profileAnalysis.map(profile => [
        profile.profile,
        profile.total_contatos.toLocaleString(),
        `${profile.taxa_resposta.toFixed(1)}%`,
        profile.tempo_medio_resposta ? `${profile.tempo_medio_resposta}min` : 'N/A',
        profile.melhor_horario || 'N/A'
      ]),
    });
    
    addFooter(doc, currentPage);
  }

  if (analytics.campaignPerformance.length > 0) {
    doc.addPage();
    currentPage++;
    await renderHeader(doc, {
      title: 'Zaphub360 Analytics',
      subtitle: 'Relatório Completo de Performance',
      logoBase64,
      organizationName
    });
    
    autoTable(doc, {
      ...tableStyles,
      startY: headerOffset,
      head: [['Campanha', 'Enviadas', 'Entregues', 'Respondidas', 'Taxa']],
      body: analytics.campaignPerformance.slice(0, 10).map(camp => [
        camp.name,
        camp.sent.toLocaleString(),
        camp.delivered.toLocaleString(),
        camp.responded.toLocaleString(),
        `${((camp.responded / camp.sent) * 100).toFixed(1)}%`
      ]),
    });
    
    addFooter(doc, currentPage);
  }

  // Salvar com nome descritivo
  const now = new Date();
  const dataFormatada = now.toLocaleDateString('pt-BR').replace(/\//g, '-'); // 10-11-2025
  const horaFormatada = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }).replace(/:/g, 'h'); // 15h48
  
  // Criar nome descritivo
  const orgName = organizationName?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'organizacao';
  const periodoLabel = timeRange === '7d' ? '7dias' : 
                       timeRange === '30d' ? '30dias' :
                       timeRange === '90d' ? '90dias' :
                       timeRange === '1y' ? '1ano' : 'todos';
  const tipoRelatorio = aiAnalysis ? 'completo' : 'padrao';
  
  const fileName = `zaphub360-${orgName}-${tipoRelatorio}-${periodoLabel}-${dataFormatada}-${horaFormatada}.pdf`;
  
  doc.save(fileName);
}

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

