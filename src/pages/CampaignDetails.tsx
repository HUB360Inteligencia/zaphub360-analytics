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
  Calendar, Copy, Loader2, TrendingUp, Activity, Users, AlertTriangle, Play, Pause
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

const CampaignDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campaigns, activateCampaign, pauseCampaign, isLoading } = useCampaigns();
  
  const campaign = campaigns?.find(c => c.id === id);

  // Fetch campaign messages and analytics
  const { data: campaignMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['campaign-messages', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('mensagens_enviadas')
        .select('*')
        .eq('id_campanha', id)
        .order('data_envio', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Campaign analytics
  const analytics = campaignMessages ? {
    totalMessages: campaignMessages.length,
    sentMessages: campaignMessages.filter(m => m.status === 'enviado').length,
    deliveredMessages: campaignMessages.filter(m => m.data_leitura).length,
    responseMessages: campaignMessages.filter(m => m.data_resposta).length,
    errorMessages: campaignMessages.filter(m => m.status === 'erro').length,
    queuedMessages: campaignMessages.filter(m => m.status === 'fila').length,
    progressRate: campaignMessages.length > 0 ? 
      ((campaignMessages.length - campaignMessages.filter(m => m.status === 'fila').length) / campaignMessages.length) * 100 : 0,
    responseRate: campaignMessages.filter(m => m.data_leitura).length > 0 ?
      (campaignMessages.filter(m => m.data_resposta).length / campaignMessages.filter(m => m.data_leitura).length) * 100 : 0,
  } : null;

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

  if (isLoading || messagesLoading) {
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
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Lista de Contatos</CardTitle>
                <CardDescription>Contatos da campanha e status das mensagens</CardDescription>
              </div>
              {campaign.status === 'draft' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Audiência
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {campaignMessages && campaignMessages.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enviado em</TableHead>
                        <TableHead>Lido em</TableHead>
                        <TableHead>Respondido em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignMessages.map((message) => (
                        <TableRow key={message.id}>
                          <TableCell>{message.nome_contato}</TableCell>
                          <TableCell>{message.celular}</TableCell>
                          <TableCell>
                            <Badge variant={
                              message.status === 'enviado' ? 'default' :
                              message.status === 'erro' ? 'destructive' :
                              'outline'
                            }>
                              {message.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {message.data_envio ? format(new Date(message.data_envio), 'dd/MM HH:mm', { locale: ptBR }) : '-'}
                          </TableCell>
                          <TableCell>
                            {message.data_leitura ? format(new Date(message.data_leitura), 'dd/MM HH:mm', { locale: ptBR }) : '-'}
                          </TableCell>
                          <TableCell>
                            {message.data_resposta ? format(new Date(message.data_resposta), 'dd/MM HH:mm', { locale: ptBR }) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                // Show target contacts from campaign if no messages sent yet
                <div>
                  {campaign.target_contacts && (campaign.target_contacts as any)?.contacts?.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {((campaign.target_contacts as any).contacts || []).map((contact: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{contact.name}</TableCell>
                              <TableCell>{contact.phone}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  Aguardando
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Nenhum contato selecionado</h3>
                          <p className="text-muted-foreground mb-4">
                            Adicione contatos à campanha para começar o envio das mensagens.
                          </p>
                          <Button onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}>
                            <Users className="w-4 h-4 mr-2" />
                            Gerenciar Audiência
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="message" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Conteúdo da Mensagem</CardTitle>
              <CardDescription>Visualize o conteúdo que está sendo enviado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm mx-auto bg-green-50 p-4 rounded-lg border border-green-200">
                {(campaign as any).url_media && (
                  (campaign as any).media_type === 'video' ? (
                    <video 
                      src={(campaign as any).url_media} 
                      controls 
                      className="w-full h-32 object-cover rounded mb-3" 
                    />
                  ) : (campaign as any).media_type === 'image' ? (
                    <img
                      src={(campaign as any).url_media}
                      alt="Media"
                      className="w-full h-32 object-cover rounded mb-3"
                    />
                  ) : (campaign as any).media_type === 'document' ? (
                    <div className="w-full h-16 flex items-center justify-center bg-muted rounded mb-3">
                      <span className="text-xs text-muted-foreground">📄 {(campaign as any).name_media}</span>
                    </div>
                  ) : null
                )}
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {(campaign as any).message_text || 'Conteúdo da mensagem não definido'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignDetails;