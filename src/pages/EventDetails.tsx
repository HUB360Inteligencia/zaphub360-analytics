import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Edit, ExternalLink, Send, CheckCircle, Eye, MessageSquare, 
  Calendar, MapPin, Copy, Loader2, TrendingUp, Activity, Users, AlertTriangle, Webhook
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { useEvents, useEvent } from '@/hooks/useEvents';
import { useEventAnalytics } from '@/hooks/useEventAnalytics';
import { useEventContacts } from '@/hooks/useEventContacts';
import { useEventInstances } from '@/hooks/useEventInstances';
import { EventHourlyActivityCard } from '@/components/events/EventHourlyActivityCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import EventContactsList from '@/components/events/EventContactsList';
import SentimentAnalysisCard from '@/components/events/SentimentAnalysisCard';
import ProfileAnalysisCard from '@/components/events/ProfileAnalysisCard';
import { CheckinsTable } from '@/components/events/CheckinsTable';
import { CheckinMessagesQueue } from '@/components/events/CheckinMessagesQueue';
import { CheckinPermissionsModal } from '@/components/events/CheckinPermissionsModal';
import { useEventCheckin } from '@/hooks/useEventCheckin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { data: event, isLoading: eventLoading, error } = useEvent(id || '');
  const { analytics, isLoading: analyticsLoading } = useEventAnalytics(id, selectedDate);
  const { getContactStats } = useEventContacts(id);
  const { data: eventInstances, isLoading: instancesLoading } = useEventInstances(id || '');
  
  // N8N Webhook state
  const [isWebhookLoading, setIsWebhookLoading] = useState(false);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  
  // Check-in state
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const { checkins, isLoadingCheckins, messagesQueue, isLoadingMessages } = useEventCheckin(id || '');

  // Real-time status updates
  const { data: publicEventData } = useQuery({
    queryKey: ['public-event-status-sync', event?.id],
    queryFn: async () => {
      if (!event?.id) return null;
      const { data, error } = await supabase.functions.invoke('public-event-status', {
        body: { eventId: event.id }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!event?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const contactStats = getContactStats();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'outline' as const, className: 'text-muted-foreground' },
      sending: { label: 'Disparando', variant: 'default' as const, className: 'bg-blue-500/10 text-blue-600 border-blue-200' },
      active: { label: 'Ativo', variant: 'default' as const, className: 'bg-primary/10 text-primary' },
      completed: { label: 'Concluído', variant: 'secondary' as const, className: 'bg-green-500/10 text-green-600 border-green-200' },
      failed: { label: 'Falhado', variant: 'destructive' as const, className: 'bg-red-500/10 text-red-600 border-red-200' },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, className: 'bg-destructive/10 text-destructive' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const copyPublicLink = () => {
    const publicLink = `${window.location.origin}/public/event/${event?.event_id}`;
    navigator.clipboard.writeText(publicLink);
    toast.success('Link público copiado!');
  };

  const copyCheckinLink = () => {
    const checkinUrl = `${window.location.origin}/checkin/${(event as any)?.slug}`;
    navigator.clipboard.writeText(checkinUrl);
    toast.success('Link de check-in copiado!');
  };

  const openCheckinLink = () => {
    const checkinUrl = `${window.location.origin}/checkin/${(event as any)?.slug}`;
    window.open(checkinUrl, '_blank');
  };

  const triggerN8NWebhook = async () => {
    const webhookUrl = (event as any)?.webhook_url;
    
    if (!webhookUrl?.trim()) {
      toast.error('URL do webhook N8N não configurada. Configure na edição do evento.');
      return;
    }

    setIsWebhookLoading(true);
    
    try {
      const webhookData = {
        eventId: event?.event_id,
        eventName: event?.name,
        eventStatus: publicEventData?.computedStatus || event?.status,
        analytics: analytics,
        timestamp: new Date().toISOString(),
        triggeredFrom: window.location.origin,
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(webhookData),
      });

      toast.success('Webhook N8N disparado com sucesso!');
    } catch (error) {
      console.error('Erro ao disparar webhook:', error);
      toast.error('Erro ao disparar o webhook. Verifique a URL e tente novamente.');
    } finally {
      setIsWebhookLoading(false);
    }
  };

  if (eventLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando detalhes do evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Evento não encontrado</h2>
          <p className="text-muted-foreground mb-4">O evento solicitado não existe ou foi removido.</p>
          <Button onClick={() => navigate('/events')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Eventos
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/events')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{event.name}</h1>
            <p className="text-muted-foreground">ID: {event.event_id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Dialog open={isWebhookDialogOpen} onOpenChange={setIsWebhookDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!(event as any)?.webhook_url}
              >
                <Webhook className="w-4 h-4 mr-2" />
                Webhook N8N
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Disparo do Webhook N8N</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja disparar o webhook N8N para este evento?<br/>
                  Esta ação irá enviar os dados do evento para o fluxo configurado no N8N.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsWebhookDialogOpen(false)}
                  disabled={isWebhookLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    triggerN8NWebhook();
                    setIsWebhookDialogOpen(false);
                  }}
                  disabled={isWebhookLoading}
                >
                  {isWebhookLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Disparando...
                    </>
                  ) : (
                    'Confirmar Disparo'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={copyPublicLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link Público
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/events/${event.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Check-in Link Card */}
      {(event as any)?.slug && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Link Público de Check-in
            </CardTitle>
            <CardDescription>
              Compartilhe este link para que as pessoas façam check-in no evento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input 
                value={`${window.location.origin}/checkin/${(event as any).slug}`}
                readOnly 
                className="font-mono text-sm"
              />
              <Button onClick={copyCheckinLink} variant="outline" size="sm">
                <Copy className="w-4 h-4" />
              </Button>
              <Button onClick={openCheckinLink} variant="default" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {getStatusBadge(publicEventData?.computedStatus || event.status)}
            </div>
            {event.event_date && (
              <div>
                <p className="text-sm text-muted-foreground">Data do Evento</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            )}
            {event.location && (
              <div>
                <p className="text-sm text-muted-foreground">Local</p>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Criado em</p>
              <p className="text-sm">{format(new Date(event.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
            </div>
          </div>

          {/* Event Instances */}
          {eventInstances && eventInstances.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Instâncias Configuradas</p>
              <div className="flex flex-wrap gap-2">
                {eventInstances.map((ei) => (
                  <Badge 
                    key={ei.id_instancia} 
                    variant="outline" 
                    className="flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      ei.instances_safe?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    {ei.instances_safe?.name} ({ei.instances_safe?.phone_number})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {analytics && analytics.totalMessages > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Progresso do Evento</h3>
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
                  <div className="text-xs text-muted-foreground">Fila</div>
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
                  {analytics ? Math.round((analytics.deliveredMessages / analytics.totalMessages) * 100) : 0}%
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="w-4 h-4 mr-2" />
            Contatos
          </TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="message">Mensagem</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Atividade por Horário */}
            <EventHourlyActivityCard
              hourlyActivity={analytics?.hourlyActivity || []}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />

            {/* Status Distribution */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Distribuição por Status</CardTitle>
                <CardDescription>Status das mensagens enviadas</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.statusDistribution?.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={analytics.statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {analytics.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Mensagens']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {analytics.statusDistribution.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm capitalize">{item.status}</span>
                          </div>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-72 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p>Nenhum dado de status disponível</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Analysis */}
            {analytics && (
              <SentimentAnalysisCard sentimentAnalysis={analytics.sentimentAnalysis} />
            )}
            
            {/* Profile Analysis */}
            {analytics && (
              <ProfileAnalysisCard 
                data={analytics.profileAnalysis} 
                isLoading={analyticsLoading}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <EventContactsList eventId={event.id} eventName={event.name} />
        </TabsContent>

        <TabsContent value="checkins" className="space-y-6">
          {/* Check-in Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Check-ins do Evento</h3>
          <div className="flex gap-2">
              {/* Permissions button removed - any organization user can check-in */}
              <Button
                size="sm"
                onClick={() => navigate(`/events/${event.id}/checkin`)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Fazer Check-in
              </Button>
            </div>
          </div>

          {/* Check-ins Table */}
          <CheckinsTable checkins={checkins} isLoading={isLoadingCheckins} />

          {/* Messages Queue */}
          <CheckinMessagesQueue messages={messagesQueue} isLoading={isLoadingMessages} />
        </TabsContent>

        <TabsContent value="message">
          {/* Message Preview */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Mensagem do Evento</CardTitle>
              <CardDescription>Preview da mensagem que será enviada aos contatos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{event.message_text}</p>
                {event.message_image && (
                  <div className="mt-3">
                    <img 
                      src={event.message_image} 
                      alt="Imagem do evento" 
                      className="max-w-full h-auto rounded-lg border border-border"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Permissions Modal */}
      <CheckinPermissionsModal
        eventId={id || ''}
        open={isPermissionsModalOpen}
        onOpenChange={setIsPermissionsModalOpen}
      />
    </div>
  );
};

export default EventDetails;
