
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
  Activity, Target, Zap, Clock
} from 'lucide-react';

const Reports = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [reportType, setReportType] = useState('overview');

  // Mock data - em produção seria do Supabase
  const overviewStats = {
    totalMessages: 12450,
    deliveryRate: 96.8,
    openRate: 73.2,
    responseRate: 12.4,
    activeContacts: 8940,
    campaignsThisMonth: 15,
    avgResponseTime: '2.5h',
    conversionRate: 8.7
  };

  const dailyData = [
    { date: '01/01', sent: 150, delivered: 145, read: 108, responded: 15, contacts: 890 },
    { date: '02/01', sent: 180, delivered: 174, read: 125, responded: 18, contacts: 905 },
    { date: '03/01', sent: 220, delivered: 213, read: 156, responded: 22, contacts: 920 },
    { date: '04/01', sent: 195, delivered: 188, read: 142, responded: 19, contacts: 935 },
    { date: '05/01', sent: 240, delivered: 232, read: 170, responded: 28, contacts: 950 },
    { date: '06/01', sent: 210, delivered: 203, read: 155, responded: 24, contacts: 965 },
    { date: '07/01', sent: 185, delivered: 179, read: 138, responded: 21, contacts: 980 }
  ];

  const campaignPerformance = [
    { name: 'Convite Evento', sent: 450, delivered: 430, read: 320, responded: 45, rate: 94.4 },
    { name: 'Newsletter', sent: 320, delivered: 310, read: 220, responded: 28, rate: 96.9 },
    { name: 'Pesquisa', sent: 280, delivered: 275, read: 180, responded: 22, rate: 98.2 },
    { name: 'Confirmação', sent: 190, delivered: 185, read: 140, responded: 18, rate: 97.4 }
  ];

  const hourlyActivity = [
    { hour: '06:00', messages: 12, responses: 1 },
    { hour: '07:00', messages: 28, responses: 3 },
    { hour: '08:00', messages: 65, responses: 8 },
    { hour: '09:00', messages: 89, responses: 12 },
    { hour: '10:00', messages: 112, responses: 18 },
    { hour: '11:00', messages: 98, responses: 15 },
    { hour: '12:00', messages: 76, responses: 9 },
    { hour: '13:00', messages: 54, responses: 6 },
    { hour: '14:00', messages: 89, responses: 11 },
    { hour: '15:00', messages: 134, responses: 22 },
    { hour: '16:00', messages: 156, responses: 28 },
    { hour: '17:00', messages: 142, responses: 25 },
    { hour: '18:00', messages: 98, responses: 18 },
    { hour: '19:00', messages: 76, responses: 12 },
    { hour: '20:00', messages: 45, responses: 8 },
    { hour: '21:00', messages: 32, responses: 5 }
  ];

  const segmentData = [
    { name: 'Eleitores', value: 4800, color: '#2563EB', engagement: 68 },
    { name: 'Apoiadores', value: 3200, color: '#7C3AED', engagement: 82 },
    { name: 'Lideranças', value: 2100, color: '#DC2626', engagement: 91 },
    { name: 'Mídia', value: 890, color: '#059669', engagement: 75 },
    { name: 'Outros', value: 1577, color: '#D97706', engagement: 54 }
  ];

  const topTemplates = [
    { name: 'Newsletter Semanal', uses: 128, avgOpenRate: 76.3, avgResponseRate: 15.2 },
    { name: 'Convite Evento', uses: 89, avgOpenRate: 84.1, avgResponseRate: 18.7 },
    { name: 'Pesquisa Satisfação', uses: 67, avgOpenRate: 71.5, avgResponseRate: 28.9 },
    { name: 'Confirmação Presença', uses: 45, avgOpenRate: 88.2, avgResponseRate: 22.1 },
    { name: 'Promoção Especial', uses: 23, avgOpenRate: 65.8, avgResponseRate: 12.4 }
  ];

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
                <p className="text-2xl font-bold text-slate-900">{overviewStats.totalMessages.toLocaleString()}</p>
                {getComparisonText(overviewStats.totalMessages, 10200)}
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
                <p className="text-2xl font-bold text-slate-900">{overviewStats.deliveryRate}%</p>
                {getComparisonText(overviewStats.deliveryRate, 94.2)}
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
                <p className="text-2xl font-bold text-slate-900">{overviewStats.openRate}%</p>
                {getComparisonText(overviewStats.openRate, 68.9)}
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
                <p className="text-2xl font-bold text-slate-900">{overviewStats.responseRate}%</p>
                {getComparisonText(overviewStats.responseRate, 10.8)}
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
            <CardDescription>Mensagens enviadas vs engajamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="sent" stackId="1" stroke="#2563EB" fill="#2563EB" fillOpacity={0.6} name="Enviadas" />
                <Area type="monotone" dataKey="delivered" stackId="2" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.6} name="Entregues" />
                <Area type="monotone" dataKey="read" stackId="3" stroke="#059669" fill="#059669" fillOpacity={0.6} name="Lidas" />
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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaignPerformance}>
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
                  {campaignPerformance.map((campaign, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Taxa de Entrega:</span>
                          <span className="font-medium">{campaign.rate}%</span>
                        </div>
                        <Progress value={campaign.rate} className="h-2" />
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>{campaign.delivered}/{campaign.sent} entregues</span>
                          <span>{campaign.responded} respostas</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="segments" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Distribuição de Contatos</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={segmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {segmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Contatos']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Engajamento por Segmento</h3>
                  <div className="space-y-4">
                    {segmentData.map((segment) => (
                      <div key={segment.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                            <span className="font-medium">{segment.name}</span>
                          </div>
                          <span className="text-sm text-slate-600">{segment.engagement}%</span>
                        </div>
                        <Progress value={segment.engagement} className="h-2" />
                        <div className="text-xs text-slate-500">
                          {segment.value.toLocaleString()} contatos
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <h3 className="text-lg font-semibold">Templates Mais Utilizados</h3>
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
                        <div className="font-medium">{template.avgOpenRate}%</div>
                        <Progress value={template.avgOpenRate} className="h-1 mt-1" />
                      </div>
                      <div>
                        <span className="text-slate-600">Taxa de Resposta:</span>
                        <div className="font-medium">{template.avgResponseRate}%</div>
                        <Progress value={template.avgResponseRate} className="h-1 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{overviewStats.avgResponseTime}</div>
                    <div className="text-sm text-slate-600">Tempo Médio de Resposta</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 text-center">
                    <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{overviewStats.conversionRate}%</div>
                    <div className="text-sm text-slate-600">Taxa de Conversão</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{overviewStats.activeContacts.toLocaleString()}</div>
                    <div className="text-sm text-slate-600">Contatos Ativos</div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Tendências de Engajamento</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
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
