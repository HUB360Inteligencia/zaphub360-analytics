
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, MessageSquare, TrendingUp, User, Mail, Phone, Building } from 'lucide-react';
import { useContactProfile } from '@/hooks/useContactProfile';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactProfileProps {
  contactPhone: string;
  onClose?: () => void;
}

const ContactProfile = ({ contactPhone, onClose }: ContactProfileProps) => {
  const { profileData, isLoading } = useContactProfile(contactPhone);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Erro ao carregar perfil do contato</p>
      </div>
    );
  }

  const { contact, events, messages, stats } = profileData;

  const getSentimentBadge = (sentiment: string | null) => {
    const sentimentConfig = {
      super_engajado: { label: 'Super Engajado', emoji: '🔥', className: 'bg-orange-100 text-orange-800' },
      positivo: { label: 'Positivo', emoji: '😊', className: 'bg-green-100 text-green-800' },
      neutro: { label: 'Neutro', emoji: '😐', className: 'bg-gray-100 text-gray-800' },
      negativo: { label: 'Negativo', emoji: '😞', className: 'bg-red-100 text-red-800' },
      null: { label: 'Sem classificação', emoji: '⚪', className: 'bg-gray-100 text-gray-600' },
    };
    
    const config = sentimentConfig[sentiment as keyof typeof sentimentConfig] || sentimentConfig.null;
    
    return (
      <Badge variant="outline" className={config.className}>
        <span className="mr-1">{config.emoji}</span>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      fila: { label: 'Fila', className: 'bg-gray-100 text-gray-800' },
      enviado: { label: 'Enviado', className: 'bg-blue-100 text-blue-800' },
      lido: { label: 'Lido', className: 'bg-purple-100 text-purple-800' },
      respondido: { label: 'Respondido', className: 'bg-emerald-100 text-emerald-800' },
      erro: { label: 'Erro', className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.fila;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header do Perfil */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={contact?.avatar_url || undefined} />
                  <AvatarFallback>
                    {contact?.name?.split(' ').map(n => n[0]).join('') || 
                     contactPhone.slice(-2)}
                  </AvatarFallback>
                </Avatar>
              <div className="space-y-2">
                <div>
                  <h2 className="text-2xl font-bold">
                    {contact?.name || profileData?.fullName || 'Contato sem nome'}
                  </h2>
                  <p className="text-muted-foreground">
                    {contact ? 'Contato registrado' : 'Contato não registrado'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {contactPhone}
                  </div>
                  {contact?.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {contact.email}
                    </div>
                  )}
                  {contact?.company && (
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {contact.company}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Eventos</p>
                <p className="text-lg font-bold">{stats.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Mensagens</p>
                <p className="text-lg font-bold">{stats.totalMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Lidas</p>
                <p className="text-lg font-bold">{stats.readMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Respostas</p>
                <p className="text-lg font-bold">{stats.respondedMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análise de Sentimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <div>
                <p className="text-sm text-muted-foreground">Super Engajado</p>
                <p className="font-bold text-orange-600">{stats.sentimentCounts.superEngajado}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">😊</span>
              <div>
                <p className="text-sm text-muted-foreground">Positivo</p>
                <p className="font-bold text-green-600">{stats.sentimentCounts.positivo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">😐</span>
              <div>
                <p className="text-sm text-muted-foreground">Neutro</p>
                <p className="font-bold text-gray-600">{stats.sentimentCounts.neutro}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">😞</span>
              <div>
                <p className="text-sm text-muted-foreground">Negativo</p>
                <p className="font-bold text-red-600">{stats.sentimentCounts.negativo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚪</span>
              <div>
                <p className="text-sm text-muted-foreground">Sem classificação</p>
                <p className="font-bold text-gray-600">{stats.sentimentCounts.semClassificacao}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Eventos e Mensagens */}
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages">Mensagens ({stats.totalMessages})</TabsTrigger>
          <TabsTrigger value="events">Eventos ({stats.totalEvents})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Mensagens</CardTitle>
              <CardDescription>Todas as mensagens enviadas para este contato</CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma mensagem encontrada
                </p>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{message.event_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(message.status)}
                          {getSentimentBadge(message.sentiment)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {message.message_content || 'Conteúdo da mensagem não disponível'}
                      </p>
                      {message.read_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Lida em: {format(new Date(message.read_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      )}
                      {message.responded_at && (
                        <p className="text-xs text-muted-foreground">
                          Respondida em: {format(new Date(message.responded_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Participados</CardTitle>
              <CardDescription>Eventos onde este contato foi incluído</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum evento encontrado
                </p>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{event.name}</h4>
                          {event.event_date && (
                            <p className="text-sm text-muted-foreground">
                              Data do evento: {format(new Date(event.event_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          )}
                          {event.location && (
                            <p className="text-sm text-muted-foreground">
                              Local: {event.location}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Criado em: {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        {getStatusBadge(event.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactProfile;
