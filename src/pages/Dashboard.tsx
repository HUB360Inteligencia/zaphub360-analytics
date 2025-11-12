import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Heart, TrendingUp, Clock, Send, Eye, CheckCircle, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCampaigns } from '@/hooks/useCampaigns';
import { computeCampaignStatus, getCampaignStatusBadgeConfig } from '@/lib/campaignStatus';

// Gera pares de cores para gradiente a partir de uma cor base em HSL
const deriveGradientColors = (base: string): { start: string; end: string } => {
  const match = base.match(/hsl\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)/i);
  if (match) {
    const h = Number(match[1]);
    const s = Number(match[2]);
    const l = Number(match[3]);
    const startL = Math.max(0, l - 8);
    const endL = Math.min(100, l + 8);
    return {
      start: `hsl(${Math.round(h)}, ${s}%, ${startL}%)`,
      end: `hsl(${Math.round(h)}, ${s}%, ${endL}%)`,
    };
  }
  // Fallback: mantém a mesma cor caso não esteja em HSL
  return { start: base, end: base };
};

const Dashboard = () => {
  const {
    analytics,
    isLoading: analyticsLoading
  } = useAnalytics('all');  // Modo 'all' = dados totais desde sempre
  const {
    campaigns,
    isLoading: campaignsLoading
  } = useCampaigns();
  if (analyticsLoading || campaignsLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Carregando dashboard...</p>
        </div>
      </div>;
  }
  if (!analytics) return null;

  // Preparar dados das campanhas recentes para exibição
  const recentCampaigns = campaigns.slice(0, 4).map(campaign => {
    const metrics = (campaign.metrics as any) || {};
    const total = metrics.total ?? campaign.total_mensagens ?? 0;
    const sent = metrics.sent ?? campaign.mensagens_enviadas ?? 0;
    const queued = metrics.fila ?? Math.max(0, total - sent);
    const statusLabel = campaign.status === 'active' ? 'Ativa' : campaign.status === 'completed' ? 'Concluída' : campaign.status === 'scheduled' ? 'Agendada' : 'Rascunho';
    const progress = total > 0 ? Number((((total - queued) / total) * 100).toFixed(1)) : 0;
    return {
      id: campaign.id,
      name: campaign.name,
      status: statusLabel,
      sent,
      total,
      progress
    };
  });
  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Visão geral das suas campanhas e comunicações</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            📊 Dados totais desde o início
          </p>
        </div>
        <div className="flex gap-3">
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
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Contatos com Sentimentos</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.globalSentiment.totalClassified.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">{(analytics.totalContacts - analytics.globalSentiment.totalClassified).toLocaleString()} sem classificação</p>
              </div>
              <Heart className="w-8 h-8 text-rose-600" />
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
                <p className="text-sm font-medium text-slate-600">Taxa de Resposta</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.responseRate.toFixed(1)}%</p>
                <p className="text-xs text-violet-600 flex items-center mt-1">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {analytics.responsesCount?.toLocaleString() ?? 0} respostas recebidas
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-violet-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - reorganizado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mobile-responsive">
        {/* Sentimento Global (Reduzido) */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sentimento Global</CardTitle>
            <CardDescription>Distribuição de sentimento nos contatos</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.globalSentiment.totalClassified > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <defs>
                      <linearGradient id="superEngajadoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff6b35" />
                        <stop offset="100%" stopColor="#ff8f42" />
                      </linearGradient>
                      <linearGradient id="positivoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                      <linearGradient id="neutroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6b7280" />
                        <stop offset="100%" stopColor="#9ca3af" />
                      </linearGradient>
                      <linearGradient id="negativoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f87171" />
                      </linearGradient>
                    </defs>
                    <Pie data={analytics.globalSentiment.distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={3} dataKey="count">
                      {analytics.globalSentiment.distribution.map((entry, index) => {
                        const fillMap = {
                          'Super Engajado': 'url(#superEngajadoGradient)',
                          'Positivo': 'url(#positivoGradient)',
                          'Neutro': 'url(#neutroGradient)',
                          'Negativo': 'url(#negativoGradient)'
                        };
                        return (<Cell key={`sentiment-cell-top-${index}`} fill={fillMap[entry.sentiment] || (entry as any).color} />);
                      })}
                    </Pie>
                    <Tooltip formatter={(value, _name, item) => [
                      `${Number(value).toLocaleString()} (${Math.round(item.payload.percentage)}%)`,
                      item.payload.sentiment
                    ]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {analytics.globalSentiment.distribution.map((item) => (
                    <div key={item.sentiment} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: item.color as any }}></div>
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
          <CardContent>
            {analytics.contactsByProfile && analytics.contactsByProfile.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <defs>
                      {analytics.contactsByProfile.map((entry, index) => {
                        const { start, end } = deriveGradientColors(entry.color as string);
                        return (
                          <linearGradient id={`profileGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%" key={`profileGradient-${index}`}>
                            <stop offset="0%" stopColor={start} />
                            <stop offset="100%" stopColor={end} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <Pie data={analytics.contactsByProfile} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={5} dataKey="count">
                      {analytics.contactsByProfile.map((entry, index) => (<Cell key={`cell-side-${index}`} fill={`url(#profileGradient-${index})`} />))}
                    </Pie>
                    <Tooltip formatter={(value, _name, item) => [
                      `${Number(value).toLocaleString()} (${Math.round(item.payload.percentage)}%)`,
                      item.payload.profile
                    ]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {analytics.contactsByProfile.map((segment) => (
                    <div key={segment.profile} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(45deg, ${deriveGradientColors(segment.color as string).start}, ${deriveGradientColors(segment.color as string).end})` }}></div>
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

      {/* Performance + Segmentação lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mobile-responsive">
        {/* Performance das Campanhas (reduzido) */}
        {analytics.campaignPerformance.length > 0 && (
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Performance das Campanhas</CardTitle>
              <CardDescription>Métricas detalhadas das últimas campanhas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics.campaignPerformance} barCategoryGap={28} barGap={8} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <defs>
                    <linearGradient id="barSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#93c5fd" />
                      <stop offset="100%" stopColor="#2563EB" />
                    </linearGradient>
                    <linearGradient id="barDelivered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d8b4fe" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                    <linearGradient id="barErrors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fca5a5" />
                      <stop offset="100%" stopColor="#DC2626" />
                    </linearGradient>
                    <linearGradient id="barResponded" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" tickMargin={12} />
                  <YAxis stroke="#64748b" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Bar dataKey="sent" fill="url(#barSent)" name="Enviadas" />
                  <Bar dataKey="delivered" fill="url(#barDelivered)" name="Entregues" />
                  <Bar dataKey="errors" fill="url(#barErrors)" name="Erros" />
                  <Bar dataKey="responded" fill="url(#barResponded)" name="Respondidos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Engajamento por Dia (ao lado da Performance) */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Engajamento por Dia (Histórico Completo)</CardTitle>
            <CardDescription>Mensagens Enviadas vs Respondidas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={analytics.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="messages" stroke="#2563EB" strokeWidth={3} name="Mensagens" />
                <Line type="monotone" dataKey="responses" stroke="#7C3AED" strokeWidth={3} name="Respostas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>


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
          {recentCampaigns.length > 0 ? <div className="space-y-4">
              {recentCampaigns.map((campaign) => (<div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{campaign.name}</h4>
                    <div className="flex items-center gap-4 mt-2">
                      {(() => {
                        const base = campaigns.find(c => c.id === campaign.id);
                        const total = campaign.total || 0;
                        const sentProcessed = campaign.sent || 0;
                        const queuedFromMetrics = (base as any)?.metrics?.fila ?? Math.max(0, total - sentProcessed);
                        const derived = computeCampaignStatus(
                          { totalMessages: total, queuedMessages: queuedFromMetrics, sentMessages: sentProcessed },
                          base?.status || 'draft'
                        );
                        const cfg = getCampaignStatusBadgeConfig(derived);
                        return (
                          <Badge variant={cfg.variant} className={cfg.className}>
                            {cfg.label}
                          </Badge>
                        );
                      })()}
                      <span className="text-sm text-slate-600">{campaign.sent.toLocaleString()} mensagens enviadas</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <div className="text-xs font-medium text-slate-700 mb-1">{campaign.sent.toLocaleString()}/{campaign.total.toLocaleString()}</div>
                      <Progress value={campaign.progress} className="h-2" />
                      <span className="text-xs text-slate-600 mt-1">{campaign.progress}%</span>
                    </div>
                    <Link to={`/campaigns/${campaign.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>))}
            </div> : <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500">Nenhuma campanha criada ainda</p>
              <Link to="/campaigns">
                <Button variant="outline" size="sm" className="mt-2">
                  Criar primeira campanha
                </Button>
              </Link>
            </div>}
        </CardContent>
      </Card>
    </div>
  );
};
export default Dashboard;