import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Edit, Send, CheckCircle, Eye, MessageSquare, 
  Calendar, Copy, Loader2, TrendingUp, Activity, Users, AlertTriangle, Play, Pause, ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import CampaignContactsTable from '@/components/campaigns/CampaignContactsTable';
import WhatsAppMessagePreview from '@/components/campaigns/WhatsAppMessagePreview';

const CampaignDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campaigns, activateCampaign, pauseCampaign, isLoading } = useCampaigns();
  
  const campaign = campaigns?.find(c => c.id === id);

// ---- CONTADORES (não sofrem o limite de 1000) ----
const { data: counts, isLoading: countsLoading } = useQuery({
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

// ---- LISTA paginada só para a aba "Contatos" (opcional) ----
const [page, setPage] = useState(0);
const PAGE_SIZE = 200;

const { data: campaignMessages, isLoading: messagesLoading } = useQuery({
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
      .range(from, to); // evita o corte dos 1000
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
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const publicUrl = `${window.location.origin}/public/campaign-status/${campaign.id}`;
              navigator.clipboard.writeText(publicUrl);
              toast.success('Link público copiado para a área de transferência!');
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Link Público
          </Button>
          {campaign.status === 'draft' && (
            <Button onClick={handleActivateCampaign} size="sm">
              <Play className="w-4 h-4 mr-2" />
              Ativar Campanha
            </Button>
          )}
          {campaign.status === 'active' && (
            <Button onClick={handlePauseCampaign} variant="outline" size="sm">
              <Pause className="w-4 h-4 mr-2" />
              Pausar Campanha
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to={`/campaigns/${campaign.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Campaign Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {getStatusBadge(campaign.status)}
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
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <CampaignContactsTable campaignMessages={campaignMessages} campaign={campaign} navigate={navigate} />
        </TabsContent>

        <TabsContent value="message" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Conteúdo da Mensagem</CardTitle>
              <CardDescription>Visualize o conteúdo que está sendo enviado</CardDescription>
            </CardHeader>
            <CardContent>
              <WhatsAppMessagePreview
                message={(campaign as any).message_text || 'Conteúdo da mensagem não definido'}
                mediaType={(campaign as any).media_type}
                mediaUrl={(campaign as any).url_media}
                mediaName={(campaign as any).name_media}
                mimeType={(campaign as any).mime_type}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignDetails;