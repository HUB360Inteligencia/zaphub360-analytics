import { useState, Suspense, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Edit, Send, CheckCircle, Eye, MessageSquare, 
  Calendar, Copy, Loader2, TrendingUp, Activity, Users, AlertTriangle, Play, Pause, ExternalLink, Download, Menu, Trash2
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCampaignAnalytics } from '@/hooks/useCampaignAnalytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import CampaignContactsList from '@/components/campaigns/CampaignContactsList';
import WhatsAppMessagePreview from '@/components/campaigns/WhatsAppMessagePreview';
import CampaignHourlyActivityCard from '@/components/campaigns/CampaignHourlyActivityCard';
import CampaignSentimentAnalysisCard from '@/components/campaigns/CampaignSentimentAnalysisCard';
import { computeCampaignStatus, getCampaignStatusBadgeConfig } from '@/lib/campaignStatus';
import ExportReportModal from '@/components/campaigns/ExportReportModal';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const CampaignDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { campaigns, activateCampaign, pauseCampaign, resumeCampaign, isLoading, deleteCampaign } = useCampaigns();
  const { analytics: campaignAnalytics } = useCampaignAnalytics(id, selectedDate);
  const { organization } = useAuth();
  
  const campaign = campaigns?.find(c => c.id === id);

  // UI state para confirmação/execução de pause/resume e undo temporário
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);
  const [isProcessingPause, setIsProcessingPause] = useState(false);
  const [isProcessingResume, setIsProcessingResume] = useState(false);
  const [lastPauseBatchId, setLastPauseBatchId] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimerRef = useRef<number | null>(null);

  // Export modal
  const [exportOpen, setExportOpen] = useState(false);
  const hourlyRef = useRef<HTMLDivElement>(null);
  const sentimentRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Estados para exclusão e desfazer
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const deletedCampaignRef = useRef<any | null>(null);
  const undoDeleteTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      if (undoDeleteTimerRef.current) {
        window.clearTimeout(undoDeleteTimerRef.current);
        undoDeleteTimerRef.current = null;
      }
    };
  }, []);

  const handlePauseClick = () => setShowPauseConfirm(true);
  const handleResumeClick = () => setShowResumeConfirm(true);

  const confirmPause = async () => {
    if (!campaign) return;
    setIsProcessingPause(true);
    try {
      const result = await pauseCampaign.mutateAsync(campaign.id);
      const batchId = result?.pauseBatchId || null;
      setLastPauseBatchId(batchId);
      setShowPauseConfirm(false);
      setShowUndo(true);

      // Permitir desfazer por 20 segundos
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = window.setTimeout(() => {
        setShowUndo(false);
        setLastPauseBatchId(null);
        undoTimerRef.current = null;
      }, 20000);

    } catch (error) {
      console.error('Erro ao pausar campanha:', error);
      toast.error('Erro ao pausar a campanha');
    } finally {
      setIsProcessingPause(false);
    }
  };

  const handleUndoPause = async () => {
    if (!campaign) return;
    if (!lastPauseBatchId) {
      toast.error('Não há ação de pausa para desfazer');
      return;
    }

    setIsProcessingResume(true);
    try {
      await resumeCampaign.mutateAsync({ id: campaign.id, batchId: lastPauseBatchId });
      toast.success('Pausa desfeita com sucesso');
      setShowUndo(false);
      setLastPauseBatchId(null);
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    } catch (error) {
      console.error('Erro ao desfazer pausa:', error);
      toast.error('Erro ao desfazer a pausa');
    } finally {
      setIsProcessingResume(false);
    }
  };

  const confirmResume = async () => {
    if (!campaign) return;
    setIsProcessingResume(true);
    try {
      // Se tiver batch_id local, passa para garantir que só reverte as mensagens alteradas pela pausa
      await resumeCampaign.mutateAsync({ id: campaign.id, batchId: lastPauseBatchId || undefined });
      toast.success('Campanha retomada com sucesso!');
      setShowResumeConfirm(false);

      // limpar estado de undo se existir
      setShowUndo(false);
      setLastPauseBatchId(null);
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    } catch (error) {
      console.error('Erro ao retomar campanha:', error);
      toast.error('Erro ao retomar a campanha');
    } finally {
      setIsProcessingResume(false);
    }
  };

  // Ações de exclusão com desfazer
  const handleDeleteClick = () => setShowDeleteConfirm(true);

  const confirmDelete = async () => {
    if (!campaign) return;
    setIsProcessingDelete(true);
    try {
      deletedCampaignRef.current = campaign;
      await deleteCampaign.mutateAsync(campaign.id);
      setShowDeleteConfirm(false);

      toast.success('Campanha excluída. Você pode desfazer por 10 segundos.', {
        action: {
          label: 'Desfazer',
          onClick: async () => {
            await handleUndoDelete();
          },
        },
      } as any);

      undoDeleteTimerRef.current = window.setTimeout(() => {
        deletedCampaignRef.current = null;
        undoDeleteTimerRef.current = null;
      }, 10000);

      navigate('/campaigns');
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      toast.error('Erro ao excluir a campanha');
    } finally {
      setIsProcessingDelete(false);
    }
  };

  const handleUndoDelete = async () => {
    const backup = deletedCampaignRef.current;
    if (!backup) {
      toast.error('Tempo de desfazer expirado');
      return;
    }
    try {
      const { created_at, updated_at, id: _oldId, ...rest } = backup;
      const { data, error } = await supabase.from('campaigns').insert(rest).select().single();
      if (error) throw error;
      toast.success('Exclusão desfeita com sucesso!');
      deletedCampaignRef.current = null;
      if (undoDeleteTimerRef.current) {
        window.clearTimeout(undoDeleteTimerRef.current);
        undoDeleteTimerRef.current = null;
      }
      if (data?.id) {
        navigate(`/campaigns/${data.id}`);
      }
    } catch (error) {
      console.error('Erro ao desfazer exclusão:', error);
      toast.error('Não foi possível desfazer a exclusão');
    }
  };

// ---- CONTADORES (sem limite de paginação) ----
const { data: counts, isLoading: countsLoading, error: countsError } = useQuery({
  queryKey: ['campaign-counts', id],
  enabled: !!id,
  refetchInterval: 30000, // Refresh every 30 seconds
  staleTime: 0, // Always fetch fresh data
  queryFn: async () => {
    // total de mensagens da campanha
    const { count: total, error: eTotal } = await supabase
      .from('mensagens_enviadas')
      .select('id', { count: 'exact', head: true })
      .eq('id_campanha', id);
    if (eTotal) throw eTotal;

    // fila/pendente/processando
    const { count: fila, error: eFila } = await supabase
      .from('mensagens_enviadas')
      .select('id', { count: 'exact', head: true })
      .eq('id_campanha', id)
      .in('status', ['fila', 'pendente', 'processando']);
    if (eFila) throw eFila;

    // enviados (enviado + erro) - para cálculo da taxa de entrega e resposta
    const { count: enviados, error: eEnv } = await supabase
      .from('mensagens_enviadas')
      .select('id', { count: 'exact', head: true })
      .eq('id_campanha', id)
      .in('status', ['enviado', 'erro']);
    if (eEnv) throw eEnv;

    // entregues (apenas status 'enviado', não inclui 'erro')
    const { count: entregues, error: eEnt } = await supabase
      .from('mensagens_enviadas')
      .select('id', { count: 'exact', head: true })
      .eq('id_campanha', id)
      .eq('status', 'enviado');
    if (eEnt) throw eEnt;

    // respondido (tem data_resposta)
    const { count: respondidos, error: eResp } = await supabase
      .from('mensagens_enviadas')
      .select('id', { count: 'exact', head: true })
      .eq('id_campanha', id)
      .not('data_resposta', 'is', null);
    if (eResp) throw eResp;

    // erro
    const { count: erros, error: eErr } = await supabase
      .from('mensagens_enviadas')
      .select('id', { count: 'exact', head: true })
      .eq('id_campanha', id)
      .eq('status', 'erro');
    if (eErr) throw eErr;

    // Debug logs
    console.log('Campaign metrics debug:', {
      total, fila, enviados, entregues, respondidos, erros
    });

    return { total, fila, enviados, entregues, respondidos, erros };
  },
});
// métricas derivaas
const analytics = counts
  ? {
      totalMessages: counts.total ?? 0,
      queuedMessages: counts.fila ?? 0,
      sentMessages: counts.enviados ?? 0,
      deliveredMessages: counts.entregues ?? 0,
      responseMessages: counts.respondidos ?? 0,
      errorMessages: counts.erros ?? 0,
      progressRate:
        (counts.total ?? 0) > 0
          ? (((counts.total ?? 0) - (counts.fila ?? 0)) / (counts.total ?? 0)) * 100
          : 0,
      deliveryRate:
        (counts.enviados ?? 0) > 0
          ? ((counts.entregues ?? 0) / (counts.enviados ?? 0)) * 100
          : 0,
      responseRate:
        (counts.enviados ?? 0) > 0
          ? ((counts.respondidos ?? 0) / (counts.enviados ?? 0)) * 100
          : 0,
    }
  : null;

const derivedStatus = computeCampaignStatus(analytics, campaign?.status);
const badgeConfig = getCampaignStatusBadgeConfig(derivedStatus);

// ---- LISTA paginada só para a aba "Contatos" (opcional) ----
const [page, setPage] = useState(0);
const PAGE_SIZE = 200;

const { data: campaignMessages, isLoading: messagesLoading, error: messagesError } = useQuery({
  queryKey: ['campaign-messages', id, page],
  enabled: !!id,
  queryFn: async () => {
    if (!id) return [];
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('mensagens_enviadas')
      .select('*')
      .eq('id_campanha', id)
      .order('data_envio', { ascending: false })
      .range(from, to); // sem corte de paginação
    if (error) throw error;
    return data ?? [];
  },
});

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'outline' as const, className: 'text-muted-foreground' },
      scheduled: { label: 'Agendada', variant: 'default' as const, className: 'bg-blue-500/10 text-blue-600 border-blue-200' },
      active: { label: 'Ativa', variant: 'default' as const, className: 'bg-primary/10 text-primary' },
      paused: { label: 'Pausada', variant: 'secondary' as const, className: 'bg-orange-500/10 text-orange-600 border-orange-200' },
      completed: { label: 'Concluída', variant: 'secondary' as const, className: 'bg-green-500/10 text-green-600 border-green-200' },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, className: 'bg-destructive/10 text-destructive' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleActivateCampaign = async () => {
    if (!campaign) return;
    
    try {
      // Get campaign contacts and instances
      const targetContacts = campaign.target_contacts as { contacts?: any[] } | null;
      const contacts = targetContacts?.contacts || [];
      await activateCampaign.mutateAsync({
        id: campaign.id,
        targetContacts: contacts,
        templateData: {
          message_text: campaign.message_text,
          content: campaign.message_text,
          media_type: campaign.media_type,
          name_media: campaign.name_media,
          url_media: campaign.url_media,
          mime_type: campaign.mime_type
        }
      });
      toast.success('Campanha ativada com sucesso!');
    } catch (error) {
      console.error('Erro ao ativar campanha:', error);
      toast.error('Erro ao ativar a campanha');
    }
  };

  const handlePauseCampaign = async () => {
    if (!campaign) return;
    
    try {
      await pauseCampaign.mutateAsync(campaign.id);
      toast.success('Campanha pausada com sucesso!');
    } catch (error) {
      console.error('Erro ao pausar campanha:', error);
      toast.error('Erro ao pausar a campanha');
    }
  };

  if (isLoading || messagesLoading || countsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando detalhes da campanha...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Campanha não encontrada</h2>
          <p className="text-muted-foreground mb-4">A campanha solicitada não existe ou foi removida.</p>
          <Button onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às Campanhas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{campaign.name}</h1>
            <p className="text-muted-foreground">{campaign.description}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          {/* Botão desfazer após pausa (continua visível quando aplicável) */}
          {showUndo && lastPauseBatchId && (
            <Button variant="ghost" size="sm" onClick={handleUndoPause}>
              Desfazer
            </Button>
          )}

          {/* Menu suspenso de ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Abrir menu de ações">
                <Menu className="w-4 h-4 mr-2" />
                Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px] p-2 space-y-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out data-[side=bottom]:slide-in-from-top data-[side=top]:slide-in-from-bottom">
              <DropdownMenuItem
                onClick={() => {
                  const publicUrl = `${window.location.origin}/public/campaign-status/${campaign.id}`;
                  navigator.clipboard.writeText(publicUrl);
                  toast.success('Link público copiado!');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Link Público
              </DropdownMenuItem>

              {campaign.status === 'draft' && (
                <DropdownMenuItem onClick={handleActivateCampaign}>
                  <Play className="w-4 h-4 mr-2" />
                  Ativar Campanha
                </DropdownMenuItem>
              )}

              {campaign.status === 'active' && (
                <DropdownMenuItem onClick={handlePauseClick}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar Campanha
                </DropdownMenuItem>
              )}

              {campaign.status === 'paused' && (
                <DropdownMenuItem onClick={handleResumeClick}>
                  <Play className="w-4 h-4 mr-2" />
                  Retomar Campanha
                </DropdownMenuItem>
              )}

              <DropdownMenuItem asChild>
                <Link to={`/campaigns/${campaign.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setExportOpen(true)}>
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="text-destructive" onClick={handleDeleteClick}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Campanha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {(countsError || messagesError) && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          Ocorreu um erro ao carregar os dados da campanha. Tente novamente mais tarde.
        </div>
      )}

      {/* Confirm dialogs para pause/retomar */}
      <AlertDialog open={showPauseConfirm} onOpenChange={setShowPauseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pausar Campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Ao confirmar, todas as mensagens com status "pendente" ou "processando" desta campanha serão movidas para "fila". Esta ação pode ser desfeita usando o botão "Retomar Campanha" ou o botão "Desfazer" disponível imediatamente após a ação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPause} className="bg-destructive text-destructive-foreground">
              {isProcessingPause ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pausando...
                </>
              ) : (
                'Pausar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResumeConfirm} onOpenChange={setShowResumeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retomar Campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Ao confirmar, as mensagens que foram movidas para "fila" pela ação de pausa (do batch relacionado) serão colocadas de volta em "pendente" para retomada do envio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResume}>
              {isProcessingResume ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retomando...
                </>
              ) : (
                'Retomar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. Você poderá desfazer por alguns segundos após excluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {isProcessingDelete ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Campaign Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {/* Render status badge using derived status */}
              <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
                {badgeConfig.label}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Criada em</p>
              <p className="text-sm">{format(new Date(campaign.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
            </div>
            {campaign.started_at && (
              <div>
                <p className="text-sm text-muted-foreground">Iniciada em</p>
                <p className="text-sm">{format(new Date(campaign.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Horário de Disparo</p>
              <p className="text-sm">{campaign.horario_disparo_inicio} - {campaign.horario_disparo_fim}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {analytics && analytics.totalMessages > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Progresso da Campanha</h3>
                <span className="text-sm text-muted-foreground">
                  {analytics.totalMessages - analytics.queuedMessages} de {analytics.totalMessages} processados
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso (Total - Na Fila)</span>
                  <span>{Math.round(analytics.progressRate)}%</span>
                </div>
                <Progress value={analytics.progressRate} className="h-3" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{analytics.queuedMessages}</div>
                  <div className="text-xs text-muted-foreground">Na Fila</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{analytics.sentMessages}</div>
                  <div className="text-xs text-muted-foreground">Enviados</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{analytics.deliveredMessages}</div>
                  <div className="text-xs text-muted-foreground">Entregue</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">{analytics.responseMessages}</div>
                  <div className="text-xs text-muted-foreground">Respondidos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{analytics.errorMessages}</div>
                  <div className="text-xs text-muted-foreground">Erro</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Contatos</p>
                <p className="text-2xl font-bold text-card-foreground">{analytics?.totalMessages || 0}</p>
              </div>
              <Send className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Entrega</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {analytics ? Math.round(analytics.deliveryRate) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Resposta</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {analytics ? Math.round(analytics.responseRate) : 0}%
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mensagens com Erro</p>
                <p className="text-2xl font-bold text-red-600">{analytics?.errorMessages || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="w-4 h-4 mr-2" />
            Contatos
          </TabsTrigger>
          <TabsTrigger value="message">Mensagem</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Status Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Distribuição de Status</CardTitle>
              <CardDescription>Status atual das mensagens da campanha</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics && analytics.totalMessages > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.queuedMessages}</div>
                    <div className="text-sm text-muted-foreground">Fila</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{analytics.sentMessages}</div>
                    <div className="text-sm text-muted-foreground">Enviados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.deliveredMessages}</div>
                    <div className="text-sm text-muted-foreground">Entregues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{analytics.responseMessages}</div>
                    <div className="text-sm text-muted-foreground">Respondidos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{analytics.errorMessages}</div>
                    <div className="text-sm text-muted-foreground">Erros</div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Nenhuma mensagem enviada ainda</p>
              )}
            </CardContent>
          </Card>

          {/* Campaign Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div ref={hourlyRef}>
              <CampaignHourlyActivityCard 
                hourlyActivity={campaignAnalytics?.hourlyActivity || []}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
            <div ref={sentimentRef}>
              <CampaignSentimentAnalysisCard 
                sentimentAnalysis={campaignAnalytics?.sentimentAnalysis || {
                  superEngajado: 0,
                  positivo: 0,
                  neutro: 0,
                  negativo: 0,
                  semClassificacao: 0,
                  distribution: []
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Suspense fallback={<div>Carregando contatos...</div>}>
            {/* Substitui a tabela antiga por nova lista responsiva com busca/filtros/sort server-side */}
            <CampaignContactsList campaignId={campaign.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="message" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Conteúdo da Mensagem</CardTitle>
              <CardDescription>Visualize o conteúdo que está sendo enviado</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={previewRef}>
                <WhatsAppMessagePreview
                  message={(campaign as any).message_text || 'Conteúdo da mensagem não definido'}
                  mediaType={(campaign as any).media_type}
                  mediaUrl={(campaign as any).url_media}
                  mediaName={(campaign as any).name_media}
                  mimeType={(campaign as any).mime_type}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ExportReportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        campaign={{ id: campaign!.id, name: campaign!.name, description: (campaign as any).description }}
        analytics={{
          totalMessages: analytics?.totalMessages,
          deliveredMessages: analytics?.deliveredMessages,
          responseMessages: analytics?.responseMessages,
          errorMessages: analytics?.errorMessages,
          sentimentAnalysis: campaignAnalytics?.sentimentAnalysis,
        }}
        organization={{ name: organization?.name, logo_url: organization?.logo_url } as any}
        chartRefs={{
          hourly: hourlyRef.current!,
          sentiment: sentimentRef.current!,
          preview: previewRef.current!,
        }}
      />
    </div>
  );
};

export default CampaignDetails;