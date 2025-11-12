import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
         ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface SentimentAnalysisProps {
  globalSentiment: {
    distribution: { sentiment: string; count: number; percentage: number; color: string }[];
    totalClassified: number;
  };
  sentimentTrend: {
    date: string;
    super_engajado: number;
    positivo: number;
    neutro: number;
    negativo: number;
  }[];
}

export const SentimentAnalysis = ({ globalSentiment, sentimentTrend }: SentimentAnalysisProps) => {
  const COLORS = {
    super_engajado: '#FF6B35',
    positivo: '#10B981',
    neutro: '#6B7280',
    negativo: '#EF4444',
  };
  
  return (
    <div className="space-y-6">
      {/* Cards de Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {globalSentiment.distribution.map((item) => (
          <Card key={item.sentiment} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600">{item.sentiment}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{item.count.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">{item.percentage.toFixed(1)}%</p>
              <div 
                className="h-1 rounded-full mt-2" 
                style={{ 
                  backgroundColor: item.color,
                  width: `${item.percentage}%`,
                  minWidth: '10%'
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Gráfico de Pizza */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Distribuição de Sentimento</CardTitle>
          <CardDescription>Proporção de cada tipo de sentimento</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={globalSentiment.distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ sentiment, percentage }) => `${sentiment}: ${percentage.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                animationBegin={0}
                animationDuration={800}
              >
                {globalSentiment.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Evolução Temporal */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Evolução do Sentimento ao Longo do Tempo</CardTitle>
          <CardDescription>Acompanhe como o sentimento dos contatos mudou</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={sentimentTrend}>
              <defs>
                <linearGradient id="colorSuperEngajado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.super_engajado} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.super_engajado} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorPositivo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.positivo} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.positivo} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorNeutro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.neutro} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.neutro} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorNegativo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.negativo} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.negativo} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Area 
                type="monotone" 
                dataKey="super_engajado" 
                stackId="1" 
                stroke={COLORS.super_engajado} 
                fill="url(#colorSuperEngajado)"
                name="Super Engajado" 
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Area 
                type="monotone" 
                dataKey="positivo" 
                stackId="1" 
                stroke={COLORS.positivo} 
                fill="url(#colorPositivo)"
                name="Positivo" 
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Area 
                type="monotone" 
                dataKey="neutro" 
                stackId="1" 
                stroke={COLORS.neutro} 
                fill="url(#colorNeutro)"
                name="Neutro" 
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Area 
                type="monotone" 
                dataKey="negativo" 
                stackId="1" 
                stroke={COLORS.negativo} 
                fill="url(#colorNegativo)"
                name="Negativo" 
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">💡 Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              <strong>Satisfação Geral:</strong> {' '}
              {(() => {
                const satisfeitos = globalSentiment.distribution
                  .filter(s => ['Super Engajado', 'Positivo'].includes(s.sentiment))
                  .reduce((acc, s) => acc + s.percentage, 0);
                return (
                  <span className={satisfeitos >= 70 ? 'text-green-600 font-semibold' : satisfeitos >= 50 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {satisfeitos.toFixed(1)}% dos contatos estão satisfeitos
                  </span>
                );
              })()}
            </p>
            <p className="text-sm text-slate-700">
              <strong>Total Classificado:</strong> {globalSentiment.totalClassified.toLocaleString()} contatos
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

