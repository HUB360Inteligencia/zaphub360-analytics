import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { exportCampaignReport, ExportSections } from '@/lib/pdfExport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: { id: string; name: string; description?: string | null } | null;
  analytics?: {
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
      distribution: Array<{ sentiment: string; count: number; percentage: number; color: string; emoji?: string }>;
    }
  } | null;
  organization?: { name?: string | null; logo_url?: string | null } | null;
  chartRefs?: { hourly?: HTMLElement | null; sentiment?: HTMLElement | null; preview?: HTMLElement | null };
}

const ExportReportModal = ({ isOpen, onClose, campaign, analytics, organization, chartRefs }: ExportReportModalProps) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [formatType, setFormatType] = useState<string>('pdf');
  const [sections, setSections] = useState<ExportSections>({
    overview: true,
    hourlyActivity: true,
    sentimentAnalysis: true,
    messagePreview: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const isValidRange = useMemo(() => {
    if (!startDate || !endDate) return true; // optional
    return new Date(startDate) <= new Date(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    if (!isOpen) {
      setIsGenerating(false);
      setProgress(0);
      setProgressLabel('');
    }
  }, [isOpen]);

  const handleExport = async () => {
    if (!campaign || formatType !== 'pdf') return;
    setIsGenerating(true);
    try {
      await exportCampaignReport({
        campaign: { id: campaign.id, name: campaign.name, description: campaign.description ?? undefined },
        analytics: analytics ?? undefined,
        dateRange: {
          start: startDate ? new Date(startDate) : undefined,
          end: endDate ? new Date(endDate) : undefined,
        },
        sections,
        charts: {
          hourlyActivity: chartRefs?.hourly ?? undefined,
          sentimentAnalysis: chartRefs?.sentiment ?? undefined,
          messagePreview: chartRefs?.preview ?? undefined,
        },
        organization: {
          name: organization?.name ?? undefined,
          logoUrl: organization?.logo_url ?? undefined,
        },
        palette: { primary: '#3B82F6' },
        onProgress: (percent, label) => {
          setProgress(percent);
          if (label) setProgressLabel(label);
        },
      });
    } catch (e) {
      console.error('Erro ao exportar PDF', e);
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setProgressLabel('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
          <DialogDescription>
            Configure o relatório da campanha antes de gerar o arquivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Campanha</p>
            <p className="text-base font-medium">{campaign?.name ?? '—'}</p>
          </div>

          {/* Intervalo de datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Data inicial</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Data final</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {!isValidRange && (
            <p className="text-sm text-red-600">Intervalo inválido: a data inicial deve ser anterior à final.</p>
          )}

          {/* Seções */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Seções a incluir</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={sections.overview} onChange={(e) => setSections(s => ({ ...s, overview: e.target.checked }))} />
                <span>Visão Geral</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={sections.hourlyActivity} onChange={(e) => setSections(s => ({ ...s, hourlyActivity: e.target.checked }))} />
                <span>Atividade por Horário</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={sections.sentimentAnalysis} onChange={(e) => setSections(s => ({ ...s, sentimentAnalysis: e.target.checked }))} />
                <span>Análise de Sentimento</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={sections.messagePreview} onChange={(e) => setSections(s => ({ ...s, messagePreview: e.target.checked }))} />
                <span>Prévia da Mensagem</span>
              </label>
            </div>
          </div>

          {/* Formato */}
          <div>
            <p className="text-sm text-muted-foreground">Formato</p>
            <Select value={formatType} onValueChange={setFormatType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progresso */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">{progressLabel}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cancelar</Button>
          <Button onClick={handleExport} disabled={!campaign || !isValidRange || isGenerating || formatType !== 'pdf'}>
            {isGenerating ? 'Gerando...' : 'Exportar Relatório'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportReportModal;