
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

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

const SentimentAnalysisCard = ({ sentimentAnalysis }: SentimentAnalysisCardProps) => {
  const hasData = sentimentAnalysis.distribution.some(item => item.count > 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Análise de Sentimento
        </CardTitle>
        <CardDescription>Classificação emocional dos contatos</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sentimentAnalysis.distribution.filter(item => item.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {sentimentAnalysis.distribution
                    .filter(item => item.count > 0)
                    .map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} contatos (${Math.round(props.payload.percentage)}%)`,
                    props.payload.sentiment
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-3">
              {sentimentAnalysis.distribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <div>
                      <div className="text-sm font-medium">{item.sentiment}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(item.percentage)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: item.color }}>
                      {item.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>Nenhum dado de sentimento disponível</p>
              <p className="text-xs mt-1">Os sentimentos serão exibidos conforme os contatos interagirem</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentimentAnalysisCard;
