
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, ThumbsUp, Minus, ThumbsDown, Circle } from 'lucide-react';
import { SENTIMENT_OPTIONS } from '@/lib/sentiment';

interface SentimentAnalysisCardProps {
  sentimentAnalysis: {
    superEngajado: number;
    positivo: number;
    neutro: number;
    negativo: number;
    distribution: Array<{
      sentiment: string;
      count: number;
      percentage: number;
      color: string;
      emoji: string;
    }>;
  };
}

const getGradientId = (sentiment: string) => {
  const gradientMap: Record<string, string> = {
    'Super Engajado': 'superEngajadoGradient',
    'Positivo': 'positivoGradient',
    'Neutro': 'neutroGradient',
    'Negativo': 'negativoGradient',
    'Sem classificação': 'defaultGradient'
  };
  return gradientMap[sentiment] || 'defaultGradient';
};

const getSentimentIcon = (sentiment: string) => {
  const sentimentOption = SENTIMENT_OPTIONS.find(option => option.label === sentiment);
  if (!sentimentOption) return Circle;
  
  const icons = { TrendingUp, ThumbsUp, Minus, ThumbsDown, Circle };
  return icons[sentimentOption.icon as keyof typeof icons] || Circle;
};

const SentimentAnalysisCard = ({ sentimentAnalysis }: SentimentAnalysisCardProps) => {
  const hasData = sentimentAnalysis.distribution.some(item => item.count > 0);

  return (
    <Card className="glass-card glass-card-dark border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2 gradient-text-primary">
          <TrendingUp className="w-5 h-5" />
          Análise de Sentimento
        </CardTitle>
        <CardDescription className="text-foreground/70">Classificação emocional dos contatos</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={220}>
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
                  <linearGradient id="defaultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9ca3af" />
                    <stop offset="100%" stopColor="#d1d5db" />
                  </linearGradient>
                </defs>
                <Pie
                  data={sentimentAnalysis.distribution.filter(item => item.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={2}
                >
                  {sentimentAnalysis.distribution
                    .filter(item => item.count > 0)
                    .map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#${getGradientId(entry.sentiment)})`}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="chart-tooltip p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {(() => {
                              const IconComponent = getSentimentIcon(data.sentiment);
                              return <IconComponent className="w-3 h-3" />;
                            })()}
                            <span className="font-medium">{data.sentiment}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {data.count} contatos ({Math.round(data.percentage)}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sentimentAnalysis.distribution.map((item, index) => {
                const IconComponent = getSentimentIcon(item.sentiment);
                const sentimentOption = SENTIMENT_OPTIONS.find(option => option.label === item.sentiment);
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: sentimentOption?.gradientColor || item.color }}
                      >
                        <IconComponent className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{item.sentiment}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(item.percentage)}% do total
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-foreground">
                        {item.count}
                      </div>
                      <div className="text-xs text-muted-foreground">contatos</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary/60" />
              </div>
              <p className="text-foreground/70 mb-1">Nenhum dado de sentimento disponível</p>
              <p className="text-xs text-muted-foreground">Os sentimentos serão exibidos conforme os contatos interagirem</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentimentAnalysisCard;
