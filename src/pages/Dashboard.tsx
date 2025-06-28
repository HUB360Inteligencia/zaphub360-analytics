
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, MessageSquare, TrendingUp, Clock, Send, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data - em produção seria do Supabase
  const stats = {
    totalContacts: 12567,
    activeCampaigns: 8,
    messagesLastWeek: 2340,
    deliveryRate: 96.8,
    openRate: 73.2,
    responseRate: 12.4
  };

  const campaignData = [
    { name: 'Campanha A', sent: 450, delivered: 430, read: 320, responded: 45 },
    { name: 'Campanha B', sent: 320, delivered: 310, read: 220, responded: 28 },
    { name: 'Campanha C', sent: 280, delivered: 275, read: 180, responded: 22 },
    { name: 'Campanha D', sent: 190, delivered: 185, read: 140, responded: 18 }
  ];

  const engagementData = [
    { date: '01/12', messages: 120, responses: 15 },
    { date: '02/12', messages: 145, responses: 18 },
    { date: '03/12', messages: 189, responses: 23 },
    { date: '04/12', messages: 167, responses: 20 },
    { date: '05/12', messages: 203, responses: 28 },
    { date: '06/12', messages: 178, responses: 22 },
    { date: '07/12', messages: 195, responses: 25 }
  ];

  const contactSegments = [
    { name: 'Eleitores', value: 4800, color: '#2563EB' },
    { name: 'Apoiadores', value: 3200, color: '#7C3AED' },
    { name: 'Lideranças', value: 2100, color: '#DC2626' },
    { name: 'Mídia', value: 890, color: '#059669' },
    { name: 'Outros', value: 1577, color: '#D97706' }
  ];

  const recentCampaigns = [
    { id: 1, name: 'Convite Evento Dezembro', status: 'Ativa', sent: 1250, progress: 75 },
    { id: 2, name: 'Pesquisa Satisfação', status: 'Concluída', sent: 890, progress: 100 },
    { id: 3, name: 'Informativo Semanal', status: 'Agendada', sent: 0, progress: 0 },
    { id: 4, name: 'Confirmação Presença', status: 'Ativa', sent: 456, progress: 45 }
  ];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard G360-Wpp</h1>
          <p className="text-slate-600">Visão geral das suas campanhas e comunicações</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white">
            <Clock className="w-4 h-4 mr-2" />
            Últimos 7 dias
          </Button>
          <Link to="/campanhas/nova">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Contatos</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalContacts.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% vs mês anterior
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Campanhas Ativas</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeCampaigns}</p>
                <p className="text-xs text-slate-500 mt-1">3 agendadas</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Taxa de Entrega</p>
                <p className="text-2xl font-bold text-slate-900">{stats.deliveryRate}%</p>
                <Progress value={stats.deliveryRate} className="mt-2 h-2" />
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Taxa de Leitura</p>
                <p className="text-2xl font-bold text-slate-900">{stats.openRate}%</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <Eye className="w-3 h-3 mr-1" />
                  {stats.messagesLastWeek} mensagens
                </p>
              </div>
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Chart */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Engajamento dos Últimos 7 Dias</CardTitle>
            <CardDescription>Mensagens enviadas vs Respostas recebidas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="messages" stroke="#2563EB" strokeWidth={3} name="Mensagens" />
                <Line type="monotone" dataKey="responses" stroke="#7C3AED" strokeWidth={3} name="Respostas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contact Segments */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Segmentação de Contatos</CardTitle>
            <CardDescription>Distribuição por categorias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contactSegments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {contactSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value.toLocaleString(), 'Contatos']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {contactSegments.map((segment) => (
                <div key={segment.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                  <span className="text-sm text-slate-600">{segment.name}</span>
                  <span className="text-sm font-medium text-slate-900">{segment.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Performance das Campanhas</CardTitle>
          <CardDescription>Métricas detalhadas das últimas campanhas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
              <Bar dataKey="sent" fill="#2563EB" name="Enviadas" />
              <Bar dataKey="delivered" fill="#7C3AED" name="Entregues" />
              <Bar dataKey="read" fill="#059669" name="Lidas" />
              <Bar dataKey="responded" fill="#DC2626" name="Respostas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Campaigns */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold">Campanhas Recentes</CardTitle>
              <CardDescription>Status atual das suas campanhas</CardDescription>
            </div>
            <Link to="/campanhas">
              <Button variant="outline" size="sm">Ver Todas</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{campaign.name}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge 
                      variant={campaign.status === 'Ativa' ? 'default' : campaign.status === 'Concluída' ? 'secondary' : 'outline'}
                      className={campaign.status === 'Ativa' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {campaign.status}
                    </Badge>
                    <span className="text-sm text-slate-600">{campaign.sent.toLocaleString()} mensagens enviadas</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <Progress value={campaign.progress} className="h-2" />
                    <span className="text-xs text-slate-600 mt-1">{campaign.progress}%</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
