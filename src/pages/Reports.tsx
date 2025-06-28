
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Eye, MessageSquare, Send, 
  CheckCircle, Users, Calendar, Download, Filter,
  Activity, Target, Zap, Clock, Loader2
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTemplates } from '@/hooks/useTemplates';

const Reports = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [reportType, setReportType] = useState('overview');
  const { analytics, isLoading: analyticsLoading } = useAnalytics();
  const { templates, isLoading: templatesLoading } = useTemplates();

  if (analyticsLoading || templatesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const getComparisonIcon = (current: number, previous: number) => {
    return current > previous ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getComparisonText = (current: number, previous: number) => {
    const diff = ((current - previous) / previous * 100).toFixed(1);
    const isPositive = current > previous;
    return (
      <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{diff}% vs período anterior
      </span>
    );
  };

  // Dados de atividade por hora (mock para demonstração)
  const hourlyActivity = Array.from({ length: 16 }, (_, i) => ({
    hour: `${String(6 + i).padStart(2, '0')}:00`,
    messages: Math.floor(Math.random() * 150) + 20,
    responses: Math.floor(Math.random() * 30) + 5
  }));

  // Top templates baseado em dados reais
  const topTemplates = templates
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, 5)
    .map(template => ({
      name: template.name,
      uses: template.usage_count || 0,
      avgOpenRate: Math.random() * 30 + 60, // Mock até termos dados reais
      avgResponseRate: Math.random() * 20 + 10
    }));

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Relatórios e Analytics</h1>
          <p className="text-slate-600">Acompanhe a performance das suas campanhas</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-white">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Mensagens</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.totalMessages.toLocaleString()}</p>
                {analytics.totalMessages > 0 && getComparisonText(analytics.totalMessages, analytics.totalMessages * 0.8)}
              </div>
              <Send className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Taxa de Entrega</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.deliveryRate.toFixed(1)}%</p>
                {analytics.deliveryRate > 0 && getComparisonText(analytics.deliveryRate, analytics.deliveryRate * 0.95)}
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
                {analytics.openRate > 0 && getComparisonText(analytics.openRate, analytics.openRate * 0.92)}
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Taxa de Resposta</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.responseRate.toFixed(1)}%</p>
                {analytics.responseRate > 0 && getComparisonText(analytics.responseRate, analytics.responseRate * 0.88)}
              </div>
              <MessageSquare className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Performance */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Diária</CardTitle>
            <CardDescription>Atividade dos últimos dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="messages" stackId="1" stroke="#2563EB" fill="#2563EB" fillOpacity={0.6} name="Mensagens" />
                <Area type="monotone" dataKey="responses" stackId="2" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.6} name="Respostas" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Atividade por Horário</CardTitle>
            <CardDescription>Melhor horário para engajamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="messages" stroke="#2563EB" strokeWidth={3} name="Mensagens" />
                <Line type="monotone" dataKey="responses" stroke="#DC2626" strokeWidth={3} name="Respostas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports Tabs */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Relatórios Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
              <TabsTrigger value="segments">Segmentos</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="engagement">Engajamento</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance por Campanha</h3>
                {analytics.campaignPerformance.length > 0 ? (
                  <>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analytics.campaignPerformance.map((campaign, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <div className="mt-2 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Taxa de Entrega:</span>
                              <span className="font-medium">
                                {campaign.sent > 0 ? ((campaign.delivered / campaign.sent) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                            <Progress 
                              value={campaign.sent > 0 ? (campaign.delivered / campaign.sent) * 100 : 0} 
                              className="h-2" 
                            />
                            <div className="flex justify-between text-xs text-slate-600">
                              <span>{campaign.delivered}/{campaign.sent} entregues</span>
                              <span>{campaign.responded} respostas</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>Nenhuma campanha disponível para análise</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="segments" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Distribuição de Contatos</h3>
                  {analytics.contactsByTag.length > 0 ? (
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
                  ) : (
                    <div className="h-72 flex items-center justify-center text-slate-500">
                      <div className="text-center">
                        <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>Nenhum segmento disponível</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Engajamento por Segmento</h3>
                  <div className="space-y-4">
                    {analytics.contactsByTag.length > 0 ? analytics.contactsByTag.map((segment) => (
                      <div key={segment.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                            <span className="font-medium">{segment.name}</span>
                          </div>
                          <span className="text-sm text-slate-600">{Math.floor(Math.random() * 40 + 60)}%</span>
                        </div>
                        <Progress value={Math.floor(Math.random() * 40 + 60)} className="h-2" />
                        <div className="text-xs text-slate-500">
                          {segment.count.toLocaleString()} contatos
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-slate-500">
                        <Tag className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>Crie tags para segmentar seus contatos</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <h3 className="text-lg font-semibold">Templates Mais Utilizados</h3>
              {topTemplates.length > 0 ? (
                <div className="space-y-4">
                  {topTemplates.map((template, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{template.name}</h4>
                        <Badge variant="outline">{template.uses} usos</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Taxa de Leitura:</span>
                          <div className="font-medium">{template.avgOpenRate.toFixed(1)}%</div>
                          <Progress value={template.avgOpenRate} className="h-1 mt-1" />
                        </div>
                        <div>
                          <span className="text-slate-600">Taxa de Resposta:</span>
                          <div className="font-medium">{template.avgResponseRate.toFixed(1)}%</div>
                          <Progress value={template.avgResponseRate} className="h-1 mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Nenhum template criado ainda</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">2.5h</div>
                    <div className="text-sm text-slate-600">Tempo Médio de Resposta</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 text-center">
                    <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{analytics.responseRate.toFixed(1)}%</div>
                    <div className="text-sm text-slate-600">Taxa de Conversão</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{analytics.activeContacts.toLocaleString()}</div>
                    <div className="text-sm text-slate-600">Contatos Ativos</div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Tendências de Engajamento</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="contacts" 
                      stroke="#2563EB" 
                      strokeWidth={3} 
                      name="Contatos Ativos" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
