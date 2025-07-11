
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Send, CheckCircle, Eye, MessageSquare, Activity, TrendingUp, Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell 
} from 'recharts';
import { usePublicEventAnalytics } from '@/hooks/usePublicEventAnalytics';
import { usePublicEvent } from '@/hooks/usePublicEvent';

const PublicEventStatus = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = usePublicEvent(eventId);
  const { analytics, isLoading: analyticsLoading } = usePublicEventAnalytics(eventId);

  if (eventLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando informações do evento...</p>
        </div>
      </div>
    );
  }

  if (!event || !analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Evento não encontrado</h2>
          <p className="text-muted-foreground">O evento solicitado não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">{event.name}</h1>
            <p className="text-muted-foreground">Status do Evento em Tempo Real</p>
            {event.event_date && (
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(event.event_date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Progress Overview */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Progresso Geral</h3>
                <span className="text-sm text-muted-foreground">
                  {analytics.deliveredMessages} de {analytics.totalMessages} enviados
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mensagens Enviadas</span>
                  <span>{Math.round(analytics.deliveryRate)}%</span>
                </div>
                <Progress value={analytics.deliveryRate} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Contatos</p>
                  <p className="text-2xl font-bold text-card-foreground">{analytics.totalMessages}</p>
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
                    {Math.round(analytics.deliveryRate)}%
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
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Leitura</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {Math.round(analytics.readRate)}%
                  </p>
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
                  <p className="text-2xl font-bold text-card-foreground">
                    {Math.round(analytics.responseRate)}%
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Activity */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Atividade por Horário</CardTitle>
              <CardDescription>Envio, Leitura e Resposta por hora</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.hourlyActivity?.length > 0 ? (
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
                    <Line type="monotone" dataKey="messages" stroke="#3B82F6" strokeWidth={3} name="Envio" />
                    <Line type="monotone" dataKey="read" stroke="#10B981" strokeWidth={2} name="Leitura" />
                    <Line type="monotone" dataKey="responded" stroke="#8B5CF6" strokeWidth={2} name="Resposta" />
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
              {analytics.statusDistribution?.length > 0 ? (
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

        {/* Footer */}
        <div className="text-center py-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Dados atualizados em tempo real • {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicEventStatus;
