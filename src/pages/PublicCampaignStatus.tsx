import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, Loader2, TrendingUp, Activity, 
  Send, CheckCircle, Eye, MessageSquare, AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PublicCampaignStatus = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  
  // Use the public edge function for campaign data with real-time updates
  const { data: campaignData, isLoading } = useQuery({
    queryKey: ['public-campaign-status', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      
      const { data, error } = await supabase.functions.invoke('public-campaign-status', {
        body: { campaignId }
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
    retry: 3,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando status da campanha...</p>
        </div>
      </div>
    );
  }

  if (!campaignData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Campanha não encontrada</h2>
          <p className="text-muted-foreground">A campanha solicitada não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  const campaign = campaignData;
  const analytics = campaignData.analytics;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">{campaign.name}</h1>
          <p className="text-muted-foreground">Status público da campanha em tempo real</p>
        </div>

        {/* Campaign Info */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                {getStatusBadge(campaign.status)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Criada em</p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(campaign.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Horário de Disparo</p>
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
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Progresso da Campanha</h3>
                  <p className="text-sm text-muted-foreground">
                    {analytics.totalMessages - analytics.queuedMessages} de {analytics.totalMessages} mensagens processadas
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso (Total - Na Fila)</span>
                    <span>{Math.round(analytics.progressRate)}%</span>
                  </div>
                  <Progress value={analytics.progressRate} className="h-4" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analytics.queuedMessages}</div>
                    <div className="text-xs text-muted-foreground">Fila</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{analytics.sentMessages}</div>
                    <div className="text-xs text-muted-foreground">Enviados</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analytics.deliveredMessages}</div>
                    <div className="text-xs text-muted-foreground">Entregue</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">{analytics.responseMessages}</div>
                    <div className="text-xs text-muted-foreground">Respondidos</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{analytics.errorMessages}</div>
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
                      {analytics && analytics.totalMessages > 0 ? Math.round((analytics.deliveredMessages / analytics.totalMessages) * 100) : 0}%
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

        {/* Distribution of Status */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribuição de Status</CardTitle>
            <CardDescription>Status atual das mensagens da campanha</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analytics?.queuedMessages || 0}</div>
                <div className="text-xs text-muted-foreground">Fila</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{analytics?.sentMessages || 0}</div>
                <div className="text-xs text-muted-foreground">Enviados</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analytics?.deliveredMessages || 0}</div>
                <div className="text-xs text-muted-foreground">Entregues</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{analytics?.responseMessages || 0}</div>
                <div className="text-xs text-muted-foreground">Respondidos</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-red-600">{analytics?.errorMessages || 0}</div>
                <div className="text-xs text-muted-foreground">Erros</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Preview */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Mensagem da Campanha</CardTitle>
            <CardDescription>Prévia da mensagem enviada aos contatos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-6 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{campaign.message_text}</p>
              {campaign.url_media && (
                <div className="mt-4">
                  <img 
                    src={campaign.url_media} 
                    alt="Mídia da campanha" 
                    className="max-w-full h-auto rounded-lg border border-border"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicCampaignStatus;