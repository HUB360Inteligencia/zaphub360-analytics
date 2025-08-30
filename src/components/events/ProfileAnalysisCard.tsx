import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { generateProfileColors } from '@/lib/colorUtils';
import { Users } from 'lucide-react';

interface ProfileAnalysisData {
  distribution: Array<{
    profile: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}

interface ProfileAnalysisCardProps {
  data: ProfileAnalysisData;
  isLoading?: boolean;
}

export const ProfileAnalysisCard = ({ data, isLoading }: ProfileAnalysisCardProps) => {
  if (isLoading) {
    return (
      <Card className="glass-card glass-card-dark border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="gradient-text-primary flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tipos de Convidados
          </CardTitle>
          <CardDescription className="text-foreground/70">Distribuição dos perfis dos contatos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate modern gradient colors for profiles
  const profiles = data.distribution.map(item => item.profile);
  const gradientColors = [
    'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', // Blue
    'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', // Purple
    'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', // Amber
    'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', // Pink
    'linear-gradient(135deg, #06b6d4 0%, #67e8f9 100%)', // Cyan
    'linear-gradient(135deg, #84cc16 0%, #a3e635 100%)', // Lime
    'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', // Red
    'linear-gradient(135deg, #10b981 0%, #34d399 100%)', // Emerald
  ];
  
  const chartData = data.distribution.map((item, index) => ({
    name: item.profile,
    value: item.count,
    percentage: item.percentage,
    gradient: gradientColors[index % gradientColors.length],
    gradientId: `profileGradient${index}`
  }));

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show labels for very small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="chart-tooltip p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3 h-3" />
            <span className="font-medium">{data.payload.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.value} contatos ({data.payload.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card glass-card-dark border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="gradient-text-primary flex items-center gap-2">
          <Users className="w-5 h-5" />
          Tipos de Convidados
        </CardTitle>
        <CardDescription className="text-foreground/70">Distribuição dos perfis dos contatos</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary/60" />
              </div>
              <p className="text-foreground/70">Nenhum dado de perfil disponível</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {chartData.map((entry, index) => (
                      <linearGradient key={entry.gradientId} id={entry.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={entry.gradient.split(' ')[1]} />
                        <stop offset="100%" stopColor={entry.gradient.split(' ')[3]} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#${entry.gradientId})`} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Modern Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {chartData.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-md"
                      style={{ background: item.gradient }}
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <div className="text-xs text-muted-foreground">
                        {item.percentage.toFixed(1)}% do total
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">{item.value}</div>
                    <div className="text-xs text-muted-foreground">contatos</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileAnalysisCard;