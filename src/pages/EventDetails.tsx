import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Edit, ExternalLink, Send, CheckCircle, Eye, MessageSquare, 
  Calendar, MapPin, Copy, Loader2, TrendingUp, Activity, Users
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell 
} from 'recharts';
import { useEvents, useEvent } from '@/hooks/useEvents';
import { useEventAnalytics } from '@/hooks/useEventAnalytics';
import EventContactsList from '@/components/events/EventContactsList';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading: eventLoading, error } = useEvent(id || '');
  const { analytics, isLoading: analyticsLoading } = useEventAnalytics(id);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'outline' as const, className: 'text-muted-foreground' },
      active: { label: 'Ativo', variant: 'default' as const, className: 'bg-primary/10 text-primary' },
      completed: { label: 'Concluído', variant: 'secondary' as const, className: 'bg-primary/10 text-primary' },
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

      {/* Event Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {getStatusBadge(event.status)}
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
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Mensagens</p>
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
                <p className="text-2xl font-bold text-card-foreground">{analytics?.deliveryRate.toFixed(1) || 0}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Leitura</p>
                <p className="text-2xl font-bold text-card-foreground">{analytics?.readRate.toFixed(1) || 0}%</p>
              </div>
              <Eye className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Resposta</p>
                <p className="text-2xl font-bold text-card-foreground">{analytics?.responseRate.toFixed(1) || 0}%</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary" />
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
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Activity */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Atividade por Horário</CardTitle>
                <CardDescription>Distribuição de mensagens por hora</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.hourlyActivity?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.hourlyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))', 
                          borderRadius: '8px' 
                        }}
                      />
                      <Line type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={3} name="Mensagens" />
                      <Line type="monotone" dataKey="delivered" stroke="hsl(var(--accent))" strokeWidth={2} name="Entregues" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-72 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p>Nenhuma atividade registrada</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
        </TabsContent>

        <TabsContent value="contacts">
          <EventContactsList eventId={event.id} eventName={event.name} />
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
    </div>
  );
};

export default EventDetails;