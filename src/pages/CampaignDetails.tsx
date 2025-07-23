import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Copy, 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  MessageSquare, 
  Clock,
  TrendingUp,
  Eye,
  Reply,
  Send
} from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useTemplates } from '@/hooks/useTemplates';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campaigns, activateCampaign, pauseCampaign, deleteCampaign } = useCampaigns();
  const { templates } = useTemplates();
  const [activeTab, setActiveTab] = useState('overview');

  const campaign = campaigns.find(c => c.id === id);
  const template = templates.find(t => t.id === campaign?.template_id);

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Campanha não encontrada</h2>
          <p className="text-muted-foreground mb-4">A campanha solicitada não existe ou foi removida.</p>
          <Button onClick={() => navigate('/campaigns')}>
            Voltar para Campanhas
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      case 'scheduled': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'paused': return 'Pausada';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      case 'scheduled': return 'Agendada';
      default: return 'Rascunho';
    }
  };

  const deliveryRate = campaign.total_mensagens > 0 
    ? Math.round((campaign.mensagens_enviadas / campaign.total_mensagens) * 100)
    : 0;

  const readRate = campaign.mensagens_enviadas > 0 
    ? Math.round((campaign.mensagens_lidas / campaign.mensagens_enviadas) * 100)
    : 0;

  const responseRate = campaign.mensagens_enviadas > 0 
    ? Math.round((campaign.mensagens_respondidas / campaign.mensagens_enviadas) * 100)
    : 0;

  const handleDuplicate = () => {
    // TODO: Implementar duplicação
    toast.success('Funcionalidade em desenvolvimento');
  };

  const handleEdit = () => {
    // TODO: Implementar edição
    toast.success('Funcionalidade em desenvolvimento');
  };

  const handleActivate = async () => {
    try {
      await activateCampaign.mutateAsync(campaign.id);
    } catch (error) {
      console.error('Erro ao ativar campanha:', error);
    }
  };

  const handlePause = async () => {
    try {
      await pauseCampaign.mutateAsync(campaign.id);
    } catch (error) {
      console.error('Erro ao pausar campanha:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCampaign.mutateAsync(campaign.id);
      navigate('/campaigns');
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            {campaign.description && (
              <p className="text-muted-foreground">{campaign.description}</p>
            )}
          </div>
          <Badge variant="secondary" className={getStatusColor(campaign.status)}>
            {getStatusLabel(campaign.status)}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {campaign.status === 'draft' || campaign.status === 'paused' ? (
            <Button onClick={handleActivate} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Ativar
            </Button>
          ) : campaign.status === 'active' ? (
            <Button variant="outline" onClick={handlePause}>
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </Button>
          ) : null}
          
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicar
          </Button>
          
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a campanha "{campaign.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.total_mensagens}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{campaign.mensagens_enviadas}</div>
            <div className="text-xs text-muted-foreground">
              {deliveryRate}% do total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lidas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{campaign.mensagens_lidas}</div>
            <div className="text-xs text-muted-foreground">
              {readRate}% das enviadas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respostas</CardTitle>
            <Reply className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{campaign.mensagens_respondidas}</div>
            <div className="text-xs text-muted-foreground">
              {responseRate}% das enviadas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {campaign.total_mensagens > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progresso da Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Enviadas</span>
                <span>{campaign.mensagens_enviadas} / {campaign.total_mensagens}</span>
              </div>
              <Progress value={deliveryRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Criada em:</span>
                  <span className="text-sm">
                    {format(new Date(campaign.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
                {campaign.scheduled_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Agendada para:</span>
                    <span className="text-sm">
                      {format(new Date(campaign.scheduled_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                )}
                {campaign.started_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Iniciada em:</span>
                    <span className="text-sm">
                      {format(new Date(campaign.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                )}
                {campaign.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Concluída em:</span>
                    <span className="text-sm">
                      {format(new Date(campaign.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Configurações de Envio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Intervalo:</span>
                  <span className="text-sm">
                    {campaign.intervalo_minimo}s - {campaign.intervalo_maximo}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Horário de envio:</span>
                  <span className="text-sm">
                    {campaign.horario_disparo_inicio} às {campaign.horario_disparo_fim}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tipos de conteúdo:</span>
                  <span className="text-sm">
                    {campaign.tipo_conteudo.join(', ')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="template" className="space-y-4">
          {template ? (
            <Card>
              <CardHeader>
                <CardTitle>Template: {template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Conteúdo:</h4>
                    <p className="whitespace-pre-wrap">{template.content}</p>
                  </div>
                  
                  {template.variables && template.variables.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Variáveis:</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Template não encontrado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Campanha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Contatos Alvo</h4>
                  <p className="text-sm text-muted-foreground">
                    {(campaign.target_contacts as any)?.contact_ids?.length || 0} contatos selecionados
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Intervalos de Envio</h4>
                  <p className="text-sm text-muted-foreground">
                    Mínimo: {campaign.intervalo_minimo}s | Máximo: {campaign.intervalo_maximo}s
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Horário de Funcionamento</h4>
                  <p className="text-sm text-muted-foreground">
                    Das {campaign.horario_disparo_inicio} às {campaign.horario_disparo_fim}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Taxa de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{deliveryRate}%</div>
                <p className="text-sm text-muted-foreground">
                  {campaign.mensagens_enviadas} de {campaign.total_mensagens} enviadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Taxa de Leitura</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{readRate}%</div>
                <p className="text-sm text-muted-foreground">
                  {campaign.mensagens_lidas} de {campaign.mensagens_enviadas} lidas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Taxa de Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{responseRate}%</div>
                <p className="text-sm text-muted-foreground">
                  {campaign.mensagens_respondidas} de {campaign.mensagens_enviadas} respondidas
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}