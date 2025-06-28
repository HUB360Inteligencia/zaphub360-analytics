
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, MessageSquare, TrendingUp, Clock, Send, Eye, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCampaigns } from '@/hooks/useCampaigns';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const { analytics, isLoading: analyticsLoading } = useAnalytics();
  const { campaigns, isLoading: campaignsLoading } = useCampaigns();

  if (analyticsLoading || campaignsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  // Preparar dados das campanhas recentes para exibição
  const recentCampaigns = campaigns.slice(0, 4).map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status === 'active' ? 'Ativa' : 
            campaign.status === 'completed' ? 'Concluída' : 
            campaign.status === 'scheduled' ? 'Agendada' : 'Rascunho',
    sent: campaign.metrics?.sent || 0,
    progress: campaign.status === 'completed' ? 100 : 
              campaign.status === 'active' ? Math.floor(Math.random() * 80) + 20 : 0
  }));

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
          <Link to="/campaigns">
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
                <p className="text-2xl font-bold text-slate-900">{analytics.totalContacts.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {analytics.activeContacts} ativos
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
                <p className="text-2xl font-bold text-slate-900">{analytics.activeCampaigns}</p>
                <p className="text-xs text-slate-500 mt-1">{analytics.totalCampaigns - analytics.activeCampaigns} concluídas</p>
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
                <p className="text-2xl font-bold text-slate-900">{analytics.deliveryRate.toFixed(1)}%</p>
                <Progress value={analytics.deliveryRate} className="mt-2 h-2" />
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
                <p className="text-2xl font-bold text-slate-900">{analytics.openRate.toFixed(1)}%</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <Eye className="w-3 h-3 mr-1" />
                  {analytics.totalMessages} mensagens
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
              <LineChart data={analytics.dailyActivity}>
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
            {analytics.contactsByTag.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.contactsByTag}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {analytics.contactsByTag.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toLocaleString(), 'Contatos']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {analytics.contactsByTag.map((segment) => (
                    <div key={segment.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                      <span className="text-sm text-slate-600">{segment.name}</span>
                      <span className="text-sm font-medium text-slate-900">{segment.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Nenhuma segmentação disponível</p>
                  <p className="text-sm">Crie tags para segmentar seus contatos</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      {analytics.campaignPerformance.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance das Campanhas</CardTitle>
            <CardDescription>Métricas detalhadas das últimas campanhas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.campaignPerformance}>
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
      )}

      {/* Recent Campaigns */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold">Campanhas Recentes</CardTitle>
              <CardDescription>Status atual das suas campanhas</CardDescription>
            </div>
            <Link to="/campaigns">
              <Button variant="outline" size="sm">Ver Todas</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentCampaigns.length > 0 ? (
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
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500">Nenhuma campanha criada ainda</p>
              <Link to="/campaigns">
                <Button variant="outline" size="sm" className="mt-2">
                  Criar primeira campanha
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
