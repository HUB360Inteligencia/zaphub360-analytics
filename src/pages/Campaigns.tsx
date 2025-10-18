import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Plus, Pause, Play, 
  Edit, Trash2, Eye, BarChart3, Clock, Users, MessageSquare,
  Target, Zap, CheckCircle, AlertCircle, Send
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CampaignWizard } from '@/components/campaigns/CampaignWizard';
import { useCampaigns } from '@/hooks/useCampaigns';
import { computeCampaignStatus, getCampaignStatusBadgeConfig } from '@/lib/campaignStatus';
import { Progress } from '@/components/ui/progress';

const Campaigns = () => {
  const navigate = useNavigate();
  const { campaigns, isLoading, activateCampaign, pauseCampaign } = useCampaigns();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (campaign.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4 text-green-600" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'scheduled': return <Clock className="w-4 h-4 text-purple-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'paused': return 'Pausada';
      case 'completed': return 'Concluída';
      case 'scheduled': return 'Agendada';
      case 'draft': return 'Rascunho';
      default: return status;
    }
  };

  const handleActivateCampaign = async (campaignId: string) => {
    try {
      // Buscar dados da campanha para obter contatos
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;
      
      const targetContacts = (campaign?.target_contacts as any)?.contacts || [];
      
      await activateCampaign.mutateAsync({
        id: campaignId,
        targetContacts,
        templateData: {
          message_text: campaign.message_text,
          content: campaign.message_text,
          media_type: campaign.media_type,
          name_media: campaign.name_media,
          url_media: campaign.url_media,
          mime_type: campaign.mime_type
        }
      });
    } catch (error) {
      console.error('Erro ao ativar campanha:', error);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await pauseCampaign.mutateAsync(campaignId);
    } catch (error) {
      console.error('Erro ao pausar campanha:', error);
    }
  };

  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign);
    setIsEditDialogOpen(true);
  };

  // Calcular estatísticas reais das campanhas
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalMessages = campaigns.reduce((acc, c) => acc + (c.total_mensagens || 0), 0);
  const totalSent = campaigns.reduce((acc, c) => acc + (c.mensagens_enviadas || 0), 0);
  const avgDeliveryRate = totalMessages > 0 ? (totalSent / totalMessages) * 100 : 0;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Campanhas</h1>
          <p className="text-slate-600">Crie e gerencie suas campanhas de comunicação integradas com N8n</p>
        </div>
        <div className="flex gap-3">
          <Link to="/templates">
            <Button variant="outline" className="bg-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Templates
            </Button>
          </Link>
          <Button onClick={() => navigate('/campaigns/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Wizard (Antigo)
          </Button>
        </div>
      </div>

      {/* Stats Cards - Agora com dados reais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Campanhas</p>
                <p className="text-2xl font-bold text-slate-900">{totalCampaigns}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Campanhas Ativas</p>
                <p className="text-2xl font-bold text-slate-900">{activeCampaigns}</p>
              </div>
              <Zap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Taxa de Envio</p>
                <p className="text-2xl font-bold text-slate-900">{avgDeliveryRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Mensagens</p>
                <p className="text-2xl font-bold text-slate-900">{totalMessages.toLocaleString()}</p>
              </div>
              <Send className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="paused">Pausadas</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="scheduled">Agendadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Campanhas ({filteredCampaigns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Taxa de Resposta</TableHead>
                  <TableHead>Horário de Envio</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => {
                  const total = campaign.total_mensagens || 0;
                  const sent = campaign.mensagens_enviadas || 0;
                  const responded = campaign.mensagens_respondidas || 0;
                  const responseRate = sent > 0 ? (responded / sent) * 100 : 0;
                  const progressRate = total > 0 ? (sent / total) * 100 : 0;

                  return (
                    <TableRow key={campaign.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">{campaign.name}</div>
                          <div className="text-sm text-slate-500">{campaign.description}</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {(() => {
                          const total = campaign.total_mensagens || 0;
                          const sentProcessed = campaign.mensagens_enviadas || 0;
                          const queued = Math.max(0, total - sentProcessed);
                          const derived = computeCampaignStatus(
                            { totalMessages: total, queuedMessages: queued, sentMessages: sentProcessed },
                            campaign.status
                          );
                          const cfg = getCampaignStatusBadgeConfig(derived);
                          return (
                            <Badge variant={cfg.variant} className={cfg.className}>
                              {cfg.label}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                       <TableCell>
                         <div className="space-y-1">
                           <div className="text-sm font-medium">
                             {sent.toLocaleString()}/{total.toLocaleString()}
                           </div>
                           <Progress value={progressRate} className="h-2" />
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="text-sm">
                           <div className="font-medium">{responseRate.toFixed(1)}%</div>
                           <div className="text-slate-500">
                             {responded}/{sent}
                           </div>
                         </div>
                       </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          {campaign.horario_disparo_inicio} - {campaign.horario_disparo_fim}
                        </div>
                        <div className="text-slate-500">
                          Intervalo: {campaign.intervalo_minimo}-{campaign.intervalo_maximo}min
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/campaigns/${campaign.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha criada'}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Tente ajustar os filtros de busca para encontrar campanhas.'
                      : 'Comece criando sua primeira campanha de comunicação.'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Campanha
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Wizard */}
      <CampaignWizard 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      {/* Edit Campaign Wizard */}
      <CampaignWizard 
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingCampaign(null);
        }}
        editMode={true}
        campaignData={editingCampaign}
      />
    </div>
  );
};

export default Campaigns;
