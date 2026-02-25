import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, MapPin, Loader2, Activity, 
  Send, CheckCircle, Eye, MessageSquare, AlertTriangle
} from 'lucide-react';
import SentimentAnalysisCard from '@/components/events/SentimentAnalysisCard';
import ProfileAnalysisCard from '@/components/events/ProfileAnalysisCard';
import { EventHourlyActivityCard } from '@/components/events/EventHourlyActivityCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getStatusBadgeConfig } from '@/lib/eventStatus';

const PublicEventStatus = () => {
  // Support both legacy route (/public/event/:eventId) and new route (/:orgSlug/evento/:eventSlug)
  const { eventId, orgSlug, eventSlug } = useParams<{ 
    eventId?: string; 
    orgSlug?: string; 
    eventSlug?: string; 
  }>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  
  // Use the public edge function for event data with real-time updates
  const { data: eventData, isLoading } = useQuery({
    queryKey: ['public-event-status', eventId, orgSlug, eventSlug, selectedDate],
    queryFn: async () => {
      // Build request body based on available params
      const body: Record<string, any> = {
        selectedDate: selectedDate?.toISOString()
      };
      
      if (orgSlug && eventSlug) {
        body.orgSlug = orgSlug;
        body.eventSlug = eventSlug;
      } else if (eventId) {
        body.eventId = eventId;
      } else {
        return null;
      }
      
      const { data, error } = await supabase.functions.invoke('public-event-status', {
        body
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!(eventId || (orgSlug && eventSlug)),
    retry: 3,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const getStatusBadge = (status: string) => {
    const config = getStatusBadgeConfig(status);
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
          <p className="text-muted-foreground">Carregando status do evento...</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Evento não encontrado</h2>
          <p className="text-muted-foreground">O evento solicitado não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  const event = eventData;
  const analytics = eventData.analytics;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">{event.name}</h1>
          <p className="text-muted-foreground">Status público do evento em tempo real</p>
        </div>

        {/* Event Info */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                {getStatusBadge(event.computedStatus)}
              </div>
              {event.event_date && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Data do Evento</p>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              )}
              {event.location && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Local</p>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        {analytics && analytics.totalMessages > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Progresso do Evento</h3>
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Atividade por Horário */}
          <EventHourlyActivityCard
            hourlyActivity={eventData?.analytics?.hourlyActivity || []}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
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
              isLoading={false}
            />
          )}
        </div>

        {/* Message Preview */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Mensagem do Evento</CardTitle>
            <CardDescription>Prévia da mensagem enviada aos participantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-6 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{event.message_text}</p>
              {event.message_image && (
                <div className="mt-4">
                  <img 
                    src={event.message_image} 
                    alt="Imagem do evento" 
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

export default PublicEventStatus;
