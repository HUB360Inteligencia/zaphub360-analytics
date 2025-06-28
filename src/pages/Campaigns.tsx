
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, Plus, Calendar as CalendarIcon, Send, Pause, Play, 
  Edit, Trash2, Eye, BarChart3, Clock, Users, MessageSquare,
  Target, Zap, CheckCircle, AlertCircle, Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Campaigns = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  // Mock data - em produção seria do Supabase
  const campaigns = [
    {
      id: 1,
      name: 'Convite Evento Dezembro',
      description: 'Convite para evento de fim de ano com lideranças locais',
      status: 'Ativa',
      template: 'Convite Evento',
      targetSegments: ['Lideranças', 'Apoiadores'],
      totalContacts: 1250,
      sent: 940,
      delivered: 912,
      read: 680,
      responded: 85,
      scheduledAt: '2024-01-15 14:00',
      createdAt: '2024-01-10',
      createdBy: 'João Silva',
      deliveryRate: 97.0,
      openRate: 74.6,
      responseRate: 12.5
    },
    {
      id: 2,
      name: 'Pesquisa Satisfação',
      description: 'Pesquisa sobre satisfação com os serviços prestados',
      status: 'Concluída',
      template: 'Pesquisa',
      targetSegments: ['Eleitores'],
      totalContacts: 890,
      sent: 890,
      delivered: 867,
      read: 542,
      responded: 128,
      scheduledAt: '2024-01-12 09:00',
      createdAt: '2024-01-08',
      createdBy: 'Maria Santos',
      deliveryRate: 97.4,
      openRate: 62.5,
      responseRate: 23.6
    },
    {
      id: 3,
      name: 'Informativo Semanal',
      description: 'Newsletter semanal com principais notícias',
      status: 'Agendada',
      template: 'Newsletter',
      targetSegments: ['Todos'],
      totalContacts: 2150,
      sent: 0,
      delivered: 0,
      read: 0,
      responded: 0,
      scheduledAt: '2024-01-20 08:00',
      createdAt: '2024-01-14',
      createdBy: 'Carlos Oliveira',
      deliveryRate: 0,
      openRate: 0,
      responseRate: 0
    },
    {
      id: 4,
      name: 'Confirmação Presença',
      description: 'Confirmação de presença para reunião mensal',
      status: 'Pausada',
      template: 'Confirmação',
      targetSegments: ['Lideranças'],
      totalContacts: 456,
      sent: 205,
      delivered: 198,
      read: 145,
      responded: 32,
      scheduledAt: '2024-01-13 16:00',
      createdAt: '2024-01-12',
      createdBy: 'Ana Costa',
      deliveryRate: 96.6,
      openRate: 73.2,
      responseRate: 22.1
    }
  ];

  const templates = [
    { id: 1, name: 'Convite Evento', category: 'Eventos' },
    { id: 2, name: 'Newsletter', category: 'Informativo' },
    { id: 3, name: 'Pesquisa', category: 'Feedback' },
    { id: 4, name: 'Confirmação', category: 'Eventos' },
    { id: 5, name: 'Promoção', category: 'Marketing' }
  ];

  const segments = [
    { id: 'eleitores', name: 'Eleitores', count: 4800 },
    { id: 'apoiadores', name: 'Apoiadores', count: 3200 },
    { id: 'liderancas', name: 'Lideranças', count: 2100 },
    { id: 'midia', name: 'Mídia', count: 890 },
    { id: 'empresarios', name: 'Empresários', count: 675 }
  ];

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ativa': return <Play className="w-4 h-4 text-green-600" />;
      case 'Pausada': return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'Concluída': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'Agendada': return <Clock className="w-4 h-4 text-purple-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativa': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pausada': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Concluída': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Agendada': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Campanhas</h1>
          <p className="text-slate-600">Crie e gerencie suas campanhas de comunicação</p>
        </div>
        <div className="flex gap-3">
          <Link to="/templates">
            <Button variant="outline" className="bg-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Templates
            </Button>
          </Link>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Campanha</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações Básicas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="campaign-name">Nome da Campanha *</Label>
                      <Input id="campaign-name" placeholder="Ex: Convite Evento Janeiro" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="campaign-template">Template *</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione um template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map(template => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name} ({template.category})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="campaign-description">Descrição</Label>
                    <Textarea 
                      id="campaign-description" 
                      placeholder="Descreva o objetivo da campanha..." 
                      className="mt-1" 
                    />
                  </div>
                </div>

                {/* Segmentação */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Segmentação de Público</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {segments.map(segment => (
                      <div key={segment.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <Checkbox id={segment.id} />
                        <Label htmlFor={segment.id} className="flex-1">
                          {segment.name}
                          <span className="text-sm text-slate-500 ml-2">({segment.count} contatos)</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agendamento */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Agendamento</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Tipo de Envio</Label>
                      <Select defaultValue="scheduled">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Envio Imediato</SelectItem>
                          <SelectItem value="scheduled">Agendar Envio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal mt-1"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="time">Horário</Label>
                      <Input id="time" type="time" defaultValue="09:00" className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Configurações Avançadas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configurações Avançadas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="auto-retry" />
                      <Label htmlFor="auto-retry">Reenviar mensagens não entregues</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="track-responses" />
                      <Label htmlFor="track-responses">Rastrear respostas automaticamente</Label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button>Criar Campanha</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Campanhas</p>
                <p className="text-2xl font-bold text-slate-900">{campaigns.length}</p>
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
                <p className="text-2xl font-bold text-slate-900">
                  {campaigns.filter(c => c.status === 'Ativa').length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Taxa Média de Entrega</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(campaigns.reduce((acc, c) => acc + c.deliveryRate, 0) / campaigns.length).toFixed(1)}%
                </p>
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
                <p className="text-2xl font-bold text-slate-900">
                  {campaigns.reduce((acc, c) => acc + c.sent, 0).toLocaleString()}
                </p>
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
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="pausada">Pausadas</SelectItem>
                  <SelectItem value="concluída">Concluídas</SelectItem>
                  <SelectItem value="agendada">Agendadas</SelectItem>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Público-Alvo</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Taxa de Entrega</TableHead>
                <TableHead>Taxa de Leitura</TableHead>
                <TableHead>Agendado Para</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900">{campaign.name}</div>
                      <div className="text-sm text-slate-500">{campaign.description}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Template: {campaign.template} | Por: {campaign.createdBy}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(campaign.status)} border`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(campaign.status)}
                        {campaign.status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{campaign.totalContacts.toLocaleString()} contatos</div>
                      <div className="text-slate-500">
                        {campaign.targetSegments.join(', ')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {campaign.sent}/{campaign.totalContacts}
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(campaign.sent / campaign.totalContacts) * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{campaign.deliveryRate.toFixed(1)}%</div>
                      <div className="text-slate-500">
                        {campaign.delivered}/{campaign.sent}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{campaign.openRate.toFixed(1)}%</div>
                      <div className="text-slate-500">
                        {campaign.read}/{campaign.delivered}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(campaign.scheduledAt).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {campaign.status === 'Ativa' && (
                        <Button variant="ghost" size="sm">
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      {campaign.status === 'Pausada' && (
                        <Button variant="ghost" size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Campaigns;
