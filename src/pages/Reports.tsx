
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Eye, MessageSquare, Send, 
  CheckCircle, Users, Calendar, Download, Filter,
  Activity, Target, Zap, Clock, Loader2, Tag
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTemplates } from '@/hooks/useTemplates';
import { useAuth } from '@/contexts/AuthContext';
import ReportFiltersModal, { ReportFilters } from '@/components/reports/ReportFiltersModal';
import { SentimentAnalysis } from '@/components/reports/SentimentAnalysis';
import { GeographicAnalysis } from '@/components/reports/GeographicAnalysis';
import { ProfileAnalysis } from '@/components/reports/ProfileAnalysis';
import { QuickFilters } from '@/components/reports/QuickFilters';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { exportReportToPDF } from '@/lib/reportPdfExport';
import { exportToExcel } from '@/lib/excelExport';
import { exportAdvancedReportToPDF } from '@/lib/advancedPdfExport';
import { generateAIAnalysis } from '@/lib/openaiAnalysis';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

const Reports = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(true);
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    campaigns: [],
    tags: [],
    statuses: [],
    sentiments: [],
    cidades: [],
    perfis: [],
  });
  
  // Estados para barra de progresso de exportação
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  
  // Refs para capturar os gráficos
  const dailyChartRef = useRef<HTMLDivElement>(null);
  const hourlyChartRef = useRef<HTMLDivElement>(null);
  const sentimentChartRef = useRef<HTMLDivElement>(null);
  const segmentationChartRef = useRef<HTMLDivElement>(null);
  
  const { organization } = useAuth();
  const { analytics, isLoading: analyticsLoading, error: analyticsError } = useAnalytics(
    timeRange as import('@/hooks/useAnalytics').TimeRange,
    timeRange === 'custom' && customRange ? customRange : undefined
  );

  useEffect(() => {
    if (timeRange !== 'custom') {
      return;
    }

    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);

      const normalizedEnd = new Date(end);
      normalizedEnd.setHours(23, 59, 59, 999);

      setCustomRange({
        startDate: start.toISOString(),
        endDate: normalizedEnd.toISOString(),
      });
    } else {
      setCustomRange(null);
    }
  }, [timeRange, customStartDate, customEndDate]);
  const { templates, isLoading: templatesLoading } = useTemplates();

  const handleExport = async (format: 'pdf-standard' | 'pdf-ai' | 'excel' | 'json') => {
    if (!analytics) {
      console.error('Analytics not available for export');
      toast.error('Dados não disponíveis para exportação');
      return;
    }

    try {
      if (format === 'pdf-ai') {
        // PDF com Análise de IA
        setIsExporting(true);
        setExportProgress(0);
        setExportStatus('Iniciando geração do relatório...');
        
        try {
          // Etapa 1: Análise por IA (0-50%)
          setExportProgress(10);
          setExportStatus('🤖 Conectando com a IA...');
          
          await new Promise(resolve => setTimeout(resolve, 500)); // Pequeno delay visual
          
          setExportProgress(20);
          setExportStatus('🧠 Analisando dados de performance...');
          
          const aiAnalysis = await generateAIAnalysis(analytics, timeRange);
          
          setExportProgress(50);
          setExportStatus('✅ Análise inteligente concluída!');
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Etapa 2: Captura de gráficos (50-75%)
          setExportProgress(55);
          setExportStatus('📊 Capturando gráficos...');
          
          await new Promise(resolve => setTimeout(resolve, 400));
          
          setExportProgress(70);
          setExportStatus('📈 Processando visualizações...');
          
          // Etapa 3: Geração do PDF (75-100%)
          setExportProgress(75);
          setExportStatus('📄 Montando documento PDF...');
          
          await exportAdvancedReportToPDF(
            analytics,
            timeRange,
            {
              dailyPerformance: dailyChartRef.current || undefined,
              hourlyActivity: hourlyChartRef.current || undefined,
              sentimentGlobal: sentimentChartRef.current || undefined,
              segmentation: segmentationChartRef.current || undefined,
            },
            aiAnalysis,
            organization?.name || 'Organização'
          );
          
          setExportProgress(95);
          setExportStatus('✨ Finalizando...');
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setExportProgress(100);
          setExportStatus('✅ Relatório gerado com sucesso!');
          
          setTimeout(() => {
            setIsExporting(false);
            toast.success('✅ Relatório PDF completo com análise IA exportado com sucesso!');
          }, 1000);
          
        } catch (error) {
          console.error('Erro na análise IA:', error);
          setExportStatus('⚠️ Erro na análise IA, gerando PDF simples...');
          setExportProgress(80);
          
          await exportReportToPDF(analytics, timeRange);
          
          setExportProgress(100);
          setTimeout(() => {
            setIsExporting(false);
            toast.warning('⚠️ PDF exportado sem análise IA (erro na conexão com OpenAI)');
          }, 1000);
        }
      } else if (format === 'pdf-standard') {
        // PDF Padrão (sem IA) - mais rápido
        setIsExporting(true);
        setExportProgress(20);
        setExportStatus('📊 Capturando gráficos...');
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        setExportProgress(60);
        setExportStatus('📄 Montando documento PDF...');
        
        await exportAdvancedReportToPDF(
          analytics,
          timeRange,
          {
            dailyPerformance: dailyChartRef.current || undefined,
            hourlyActivity: hourlyChartRef.current || undefined,
            sentimentGlobal: sentimentChartRef.current || undefined,
            segmentation: segmentationChartRef.current || undefined,
          },
          undefined, // Sem análise de IA
          organization?.name || 'Organização'
        );
        
        setExportProgress(100);
        setExportStatus('✅ Relatório gerado!');
        
        setTimeout(() => {
          setIsExporting(false);
          toast.success('✅ Relatório PDF padrão exportado com sucesso!');
        }, 800);
      } else if (format === 'excel') {
        setIsExporting(true);
        setExportProgress(50);
        setExportStatus('📊 Gerando arquivo Excel...');
        
        exportToExcel(analytics, timeRange);
        
        setExportProgress(100);
        setTimeout(() => {
          setIsExporting(false);
          toast.success('Relatório Excel exportado com sucesso!');
        }, 800);
        
      } else {
        // JSON (rápido, sem progress)
        const exportData = {
          periodo: timeRange,
          dataGeracao: new Date().toLocaleString('pt-BR'),
          metricas: {
            mensagensEnviadas: analytics.totalMessages,
            mensagensEntregues: analytics.deliveredMessagesCount,
            mensagensRespondidas: analytics.respondedMessagesCount,
            taxaResposta: `${analytics.responseRate.toFixed(1)}%`,
          },
          comparacaoPeriodoAnterior: {
            mensagensEnviadas: analytics.previousPeriod.totalMessages,
            mensagensEntregues: analytics.previousPeriod.deliveredMessagesCount,
            mensagensRespondidas: analytics.previousPeriod.respondedMessagesCount,
            taxaResposta: `${analytics.previousPeriod.responseRate.toFixed(1)}%`,
          },
          campanhas: analytics.campaignPerformance,
          atividadeDiaria: analytics.dailyActivity,
          analiseGeografica: analytics.geographicData,
          analisePerfil: analytics.profileAnalysis,
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-${timeRange}-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Relatório JSON exportado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      setIsExporting(false);
      toast.error('Erro ao exportar relatório. Tente novamente.');
    }
  };

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

  if (!analytics) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-slate-600">Erro ao carregar dados dos relatórios.</p>
        </div>
      </div>
    );
  }

  // Valores padrão para novas propriedades
  const sentimentTrend = analytics.sentimentTrend || [];
  const geographicData = analytics.geographicData || [];
  const profileAnalysis = analytics.profileAnalysis || [];

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

  // Top templates baseado em dados reais com performance real
  const topTemplates = templates
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, 5)
    .map(template => {
      const performance = analytics.templatePerformance.find(p => p.templateId === template.id);
      return {
        name: template.name,
        uses: template.usage_count || 0,
        avgOpenRate: performance?.openRate || 0,
        avgResponseRate: performance?.responseRate || 0
      };
    });

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Relatórios e Analytics</h1>
          <p className="text-slate-600">Acompanhe a performance das suas campanhas</p>
        </div>
        <div className="flex gap-3">
          <Select
            value={timeRange}
            onValueChange={(value) => {
              setTimeRange(value);
              if (value !== 'custom') {
                setCustomRange(null);
              }
            }}
          >
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="60d">Últimos 60 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Data inicial</span>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Data final</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
          )}
          <Button variant="outline" className="bg-white" onClick={() => setIsFilterModalOpen(true)}>
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {(reportFilters.campaigns.length + reportFilters.tags.length + reportFilters.statuses.length + reportFilters.sentiments.length) > 0 && (
              <Badge className="ml-2" variant="default">
                {reportFilters.campaigns.length + reportFilters.tags.length + reportFilters.statuses.length + reportFilters.sentiments.length}
              </Badge>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('pdf-standard')}>
                📄 PDF Padrão (rápido)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf-ai')}>
                🤖 PDF com Análise IA
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                📊 Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                📋 Exportar JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* QuickFilters */}
      <QuickFilters 
        activeFilters={reportFilters}
        onRemoveFilter={(type, value) => {
          setReportFilters(prev => ({
            ...prev,
            [type]: Array.isArray(prev[type]) ? prev[type].filter((v: string) => v !== value) : prev[type]
          }));
        }}
        onClearAll={() => setReportFilters({ 
          campaigns: [], 
          tags: [], 
          statuses: [], 
          sentiments: [], 
          cidades: [], 
          perfis: [] 
        })}
      />

      {/* Toggle de Comparação */}
      <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-3 shadow-sm">
        <Switch 
          checked={showComparison} 
          onCheckedChange={setShowComparison}
          id="comparison-toggle"
        />
        <Label htmlFor="comparison-toggle" className="text-sm font-medium cursor-pointer">
          Comparar com período anterior
        </Label>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Mensagens Enviadas</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.totalMessages.toLocaleString()}</p>
                {showComparison && analytics.previousPeriod.totalMessages > 0 && getComparisonText(analytics.totalMessages, analytics.previousPeriod.totalMessages)}
              </div>
              <Send className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Mensagens Entregues</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.deliveredMessagesCount.toLocaleString()}</p>
                {analytics.errorMessagesCount > 0 && (
                  <span className="text-sm text-red-600">
                    {analytics.errorMessagesCount.toLocaleString()} {analytics.errorMessagesCount === 1 ? 'mensagem com erro' : 'mensagens com erro'}
                  </span>
                )}
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Mensagens Respondidas</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.respondedMessagesCount.toLocaleString()}</p>
                {showComparison && analytics.previousPeriod.respondedMessagesCount > 0 && getComparisonText(analytics.respondedMessagesCount, analytics.previousPeriod.respondedMessagesCount)}
              </div>
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Taxa de Resposta</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.responseRate.toFixed(1)}%</p>
                {showComparison && analytics.previousPeriod.responseRate > 0 && getComparisonText(analytics.responseRate, analytics.previousPeriod.responseRate)}
              </div>
              <MessageSquare className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts - 1ª Linha: Performance Diária e Atividade por Horário */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Performance */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Diária</CardTitle>
            <CardDescription>Atividade dos últimos dias</CardDescription>
          </CardHeader>
          <CardContent ref={dailyChartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <RechartsTooltip 
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
          <CardContent ref={hourlyChartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="messages" stroke="#2563EB" strokeWidth={3} name="Mensagens" />
                <Line type="monotone" dataKey="responses" stroke="#DC2626" strokeWidth={3} name="Respostas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 2ª Linha: Sentimento Global e Segmentação de Contatos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentimento Global */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sentimento Global</CardTitle>
            <CardDescription>Distribuição de sentimento nos contatos</CardDescription>
          </CardHeader>
          <CardContent ref={sentimentChartRef}>
            {analytics.globalSentiment && analytics.globalSentiment.totalClassified > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie 
                      data={analytics.globalSentiment.distribution} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={50} 
                      outerRadius={100} 
                      paddingAngle={5} 
                      dataKey="count"
                    >
                      {analytics.globalSentiment.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value, _name, item) => [
                        `${Number(value).toLocaleString()} (${Math.round(item.payload.percentage)}%)`,
                        item.payload.sentiment
                      ]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {analytics.globalSentiment.distribution.map((item) => (
                    <div key={item.sentiment} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm text-slate-600">{item.sentiment}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {item.count.toLocaleString()} ({Math.round(item.percentage)}%)
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-2">N = {analytics.globalSentiment.totalClassified} contatos classificados</div>
              </>
            ) : (
              <div className="h-56 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Não há dados de sentimento classificados ainda</p>
                  <p className="text-sm">Classifique respostas para visualizar este gráfico</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Segmentação de Contatos */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Segmentação de Contatos</CardTitle>
            <CardDescription>Distribuição por perfil</CardDescription>
          </CardHeader>
          <CardContent ref={segmentationChartRef}>
            {analytics.contactsByProfile && analytics.contactsByProfile.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie 
                      data={analytics.contactsByProfile} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={50} 
                      outerRadius={100} 
                      paddingAngle={5} 
                      dataKey="count"
                    >
                      {analytics.contactsByProfile.map((entry, index) => (
                        <Cell key={`cell-profile-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value, _name, item) => [
                        `${Number(value).toLocaleString()} (${Math.round(item.payload.percentage)}%)`,
                        item.payload.profile
                      ]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {analytics.contactsByProfile.map((segment) => (
                    <div key={segment.profile} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                        <span className="text-sm text-slate-600">{segment.profile}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {segment.count.toLocaleString()} ({Math.round(segment.percentage)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-56 text-slate-500">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Nenhuma segmentação de perfil disponível</p>
                  <p className="text-sm">Os contatos precisam ter o campo perfil preenchido para exibir este gráfico</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3ª Linha: Detailed Reports Tabs */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Relatórios Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
              <TabsTrigger value="sentiment">Sentimento</TabsTrigger>
              <TabsTrigger value="geography">Geografia</TabsTrigger>
              <TabsTrigger value="profile">Perfil</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance por Campanha</h3>
                {analytics.campaignPerformance.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.campaignPerformance}>
                        <defs>
                          <linearGradient id="reportsBarSent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#93c5fd" />
                            <stop offset="100%" stopColor="#2563EB" />
                          </linearGradient>
                          <linearGradient id="reportsBarDelivered" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#d8b4fe" />
                            <stop offset="100%" stopColor="#7C3AED" />
                          </linearGradient>
                          <linearGradient id="reportsBarRead" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="reportsBarResponded" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fca5a5" />
                            <stop offset="100%" stopColor="#DC2626" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip />
                        <Bar dataKey="sent" fill="url(#reportsBarSent)" name="Enviadas" />
                        <Bar dataKey="delivered" fill="url(#reportsBarDelivered)" name="Entregues" />
                        <Bar dataKey="read" fill="url(#reportsBarRead)" name="Lidas" />
                        <Bar dataKey="responded" fill="url(#reportsBarResponded)" name="Respostas" />
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

            <TabsContent value="sentiment" className="space-y-4">
              <SentimentAnalysis 
                globalSentiment={analytics.globalSentiment}
                sentimentTrend={sentimentTrend}
              />
            </TabsContent>

            <TabsContent value="geography" className="space-y-4">
              <GeographicAnalysis geographicData={geographicData} />
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <ProfileAnalysis profileAnalysis={profileAnalysis} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Filtros */}
      <ReportFiltersModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={reportFilters}
        onApplyFilters={setReportFilters}
        campaigns={[]}
        tags={[]}
        cidades={geographicData.map(g => g.cidade)}
        perfis={profileAnalysis.map(p => p.profile)}
      />

      {/* Dialog de Progresso de Exportação */}
      <Dialog open={isExporting} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              Gerando Relatório
            </DialogTitle>
            <DialogDescription>
              Por favor, aguarde enquanto processamos os dados...
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Barra de Progresso */}
            <div className="space-y-2">
              <Progress value={exportProgress} className="h-3" />
              <p className="text-sm text-center font-medium text-slate-700">
                {exportProgress}%
              </p>
            </div>
            
            {/* Status atual */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 text-center font-medium">
                {exportStatus}
              </p>
            </div>
            
            {/* Dica */}
            {exportProgress < 50 && (
              <p className="text-xs text-slate-500 text-center italic">
                A análise por IA pode levar de 15 a 30 segundos...
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
