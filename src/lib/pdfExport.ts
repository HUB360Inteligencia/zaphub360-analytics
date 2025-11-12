import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { AnalyticsData } from '@/hooks/useAnalytics';

export type DateRange = { start?: Date; end?: Date };

export interface ExportSections {
  overview: boolean;
  hourlyActivity: boolean;
  sentimentAnalysis: boolean;
  messagePreview: boolean;
}

export interface CampaignInfo {
  id: string;
  name: string;
  description?: string | null;
}

export interface SentimentDistributionItem {
  sentiment: string;
  count: number;
  percentage: number;
  color: string;
  emoji?: string;
}

export interface CampaignAnalyticsForExport {
  totalMessages?: number;
  deliveredMessages?: number;
  responseMessages?: number;
  errorMessages?: number;
  sentimentAnalysis?: {
    superEngajado: number;
    positivo: number;
    neutro: number;
    negativo: number;
    semClassificacao: number;
    distribution: SentimentDistributionItem[];
  };
}

export interface ChartRefs {
  hourlyActivity?: HTMLElement | null;
  sentimentAnalysis?: HTMLElement | null;
  messagePreview?: HTMLElement | null;
}

export interface OrganizationInfo {
  name?: string | null;
  logoUrl?: string | null;
}

export interface ExportOptions {
  campaign: CampaignInfo;
  analytics?: CampaignAnalyticsForExport;
  dateRange?: DateRange;
  sections: ExportSections;
  charts?: ChartRefs;
  organization?: OrganizationInfo;
  palette?: { primary?: string; secondary?: string; accent?: string };
  onProgress?: (percent: number, label?: string) => void;
}

const mm = {
  pageWidth: 210,
  pageHeight: 297,
  margin: 15,
};

async function imageUrlToDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

async function captureElementPng(el?: HTMLElement | null, widthMm = mm.pageWidth - 2 * mm.margin): Promise<{ dataUrl: string; widthMm: number; heightMm: number } | null> {
  if (!el) return null;
  try {
    const pngDataUrl = await toPng(el, {
      pixelRatio: 2,
      quality: 1,
      cacheBust: true,
      backgroundColor: 'white',
    });
    // Assume image width to fit page, compute height proportionally by intrinsic size via temporary image
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const pxPerMm = 3.7795275591; // 96 dpi approximation
        const targetWidthPx = widthMm * pxPerMm;
        const scale = targetWidthPx / img.width;
        const targetHeightMm = (img.height * scale) / pxPerMm;
        resolve({ dataUrl: pngDataUrl, widthMm, heightMm: targetHeightMm });
      };
      img.src = pngDataUrl;
    });
  } catch (e) {
    console.error('captureElementPng error', e);
    return null;
  }
}

function addFooter(doc: jsPDF, pageNumber: number, totalPages?: number) {
  const footerY = mm.pageHeight - mm.margin + 5;
  const now = new Date();
  const dateStr = now.toLocaleString('pt-BR');
  doc.setFontSize(9);
  doc.setTextColor('#6b7280');
  const pageText = totalPages && totalPages > 0 ? `Página ${pageNumber}/${totalPages}` : `Página ${pageNumber}`;
  doc.text(`Gerado em ${dateStr}`, mm.margin, footerY);
  doc.text(pageText, mm.pageWidth - mm.margin, footerY, { align: 'right' });
}

function setMetadata(doc: jsPDF, title: string, author?: string) {
  try {
    doc.setProperties({
      title,
      author: author || 'Zaphub360 Analytics',
      subject: title,
      creator: 'Zaphub360 Analytics',
    });
  } catch {/* noop */}
}

function addHeader(doc: jsPDF, campaign: CampaignInfo, organization?: OrganizationInfo, palette?: { primary?: string }) {
  const headerY = mm.margin;
  const titleX = mm.margin + 30;
  doc.setFillColor(palette?.primary || '#3B82F6');
  doc.rect(0, 0, mm.pageWidth, 12, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(12);
  doc.text(organization?.name || 'Zaphub360 Analytics', mm.margin, 8);
  doc.setTextColor('#111827');
  doc.setFontSize(18);
  doc.text(campaign.name, titleX, headerY + 20);
}

function addSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFontSize(14);
  doc.setTextColor('#111827');
  doc.text(title, mm.margin, y);
}

export async function exportCampaignReport(opts: ExportOptions): Promise<void> {
  const { campaign, analytics, dateRange, sections, charts, organization, palette, onProgress } = opts;
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });

  setMetadata(doc, `Relatório da Campanha - ${campaign.name}`, organization?.name || undefined);

  onProgress?.(5, 'Preparando cabeçalho');
  addHeader(doc, campaign, organization, { primary: palette?.primary || '#3B82F6' });

  let cursorY = mm.margin + 30;
  doc.setFontSize(10);
  doc.setTextColor('#374151');
  const rangeText = dateRange?.start && dateRange?.end
    ? `Período: ${dateRange.start.toLocaleDateString('pt-BR')} - ${dateRange.end.toLocaleDateString('pt-BR')}`
    : 'Período: completo da campanha';
  doc.text(rangeText, mm.margin, cursorY);
  cursorY += 8;

  // Overview
  if (sections.overview && analytics) {
    onProgress?.(15, 'Adicionando visão geral');
    addSectionTitle(doc, 'Visão Geral', cursorY);
    cursorY += 8;
    const boxW = (mm.pageWidth - 2 * mm.margin - 10) / 2;
    const boxH = 18;
    const drawStatBox = (x: number, y: number, label: string, value?: number, color = '#111827') => {
      doc.setDrawColor('#E5E7EB');
      doc.rect(x, y, boxW, boxH);
      doc.setTextColor('#6B7280');
      doc.setFontSize(10);
      doc.text(label, x + 4, y + 7);
      doc.setTextColor(color);
      doc.setFontSize(14);
      doc.text(String(value ?? 0), x + 4, y + 15);
    };
    const leftX = mm.margin;
    const rightX = mm.margin + boxW + 10;
    drawStatBox(leftX, cursorY, 'Total de Mensagens', analytics.totalMessages, '#3B82F6');
    drawStatBox(rightX, cursorY, 'Entregues', analytics.deliveredMessages, '#10B981');
    cursorY += boxH + 6;
    drawStatBox(leftX, cursorY, 'Respondidos', analytics.responseMessages, '#F59E0B');
    drawStatBox(rightX, cursorY, 'Erros', analytics.errorMessages, '#EF4444');
    cursorY += boxH + 12;
  }

  // Charts
  if (sections.hourlyActivity && charts?.hourlyActivity) {
    onProgress?.(35, 'Capturando gráfico de atividade horária');
    const capture = await captureElementPng(charts.hourlyActivity);
    if (capture) {
      const { dataUrl, widthMm, heightMm } = capture;
      if (cursorY + heightMm > mm.pageHeight - mm.margin - 12) {
        addFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        cursorY = mm.margin + 10;
      }
      addSectionTitle(doc, 'Atividade por Horário', cursorY);
      cursorY += 8;
      doc.addImage(dataUrl, 'PNG', mm.margin, cursorY, widthMm, heightMm);
      cursorY += heightMm + 10;
    }
  }

  if (sections.sentimentAnalysis && charts?.sentimentAnalysis) {
    onProgress?.(55, 'Capturando gráfico de sentimento');
    const capture = await captureElementPng(charts.sentimentAnalysis);
    if (capture) {
      const { dataUrl, widthMm, heightMm } = capture;
      if (cursorY + heightMm > mm.pageHeight - mm.margin - 12) {
        addFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        cursorY = mm.margin + 10;
      }
      addSectionTitle(doc, 'Análise de Sentimento', cursorY);
      cursorY += 8;
      doc.addImage(dataUrl, 'PNG', mm.margin, cursorY, widthMm, heightMm);
      cursorY += heightMm + 10;
    }
  }

  // Message preview (optional)
  if (sections.messagePreview && charts?.messagePreview) {
    onProgress?.(70, 'Capturando prévia da mensagem');
    const capture = await captureElementPng(charts.messagePreview);
    if (capture) {
      const { dataUrl, widthMm, heightMm } = capture;
      if (cursorY + heightMm > mm.pageHeight - mm.margin - 12) {
        addFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        cursorY = mm.margin + 10;
      }
      addSectionTitle(doc, 'Prévia da Mensagem', cursorY);
      cursorY += 8;
      doc.addImage(dataUrl, 'PNG', mm.margin, cursorY, widthMm, heightMm);
      cursorY += heightMm + 10;
    }
  }

  onProgress?.(90, 'Finalizando documento');
  addFooter(doc, doc.getNumberOfPages());

  const filename = `Relatorio_Campanha_${campaign.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
  onProgress?.(100, 'Concluído');
}