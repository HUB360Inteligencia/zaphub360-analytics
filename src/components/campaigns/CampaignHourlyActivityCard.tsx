import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { BarChart as BarChartIcon, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CampaignHourlyActivityCardProps {
  hourlyActivity: Array<{
    hour: string;
    enviados: number;
    entregues: number;
    respondidos: number;
    erros: number;
  }>;
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

const CampaignHourlyActivityCard = ({ 
  hourlyActivity, 
  selectedDate, 
  onDateChange 
}: CampaignHourlyActivityCardProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const hasData = hourlyActivity.some(item => item.enviados > 0 || item.entregues > 0 || item.respondidos > 0 || item.erros > 0);

  return (
    <Card className="glass-card glass-card-dark border-white/20 shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 gradient-text-primary">
              <BarChartIcon className="w-5 h-5" />
              Atividade por Horário
            </CardTitle>
            <CardDescription className="text-foreground/70">
              Distribuição de enviados, entregues, respondidos e erros ao longo do dia
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Todos os dias"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    onDateChange(date);
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  locale={ptBR}
                />
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      onDateChange(undefined);
                      setIsCalendarOpen(false);
                    }}
                  >
                    Limpar seleção
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyActivity} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
               <XAxis 
                 dataKey="hour" 
                 stroke="hsl(var(--muted-foreground))"
                 fontSize={12}
                 tickLine={false}
                 axisLine={false}
                 tick={{ fill: 'hsl(var(--muted-foreground))' }}
               />
               <YAxis 
                 stroke="hsl(var(--muted-foreground))"
                 fontSize={12}
                 tickLine={false}
                 axisLine={false}
                 tick={{ fill: 'hsl(var(--muted-foreground))' }}
               />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="chart-tooltip p-3">
                        <p className="font-medium mb-2">{label}</p>
                        {payload.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span>{entry.name}: {entry.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
               <Legend 
                 wrapperStyle={{ color: 'hsl(var(--foreground))' }}
                 iconType="circle"
               />
              <Bar 
                dataKey="enviados" 
                stackId="a"
                name="Enviados" 
                fill="#F59E0B"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="entregues" 
                stackId="a"
                name="Entregues" 
                fill="#10B981"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="respondidos" 
                stackId="a"
                name="Respondidos" 
                fill="#8B5CF6"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="erros" 
                stackId="a"
                name="Erros" 
                fill="#EF4444"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <BarChartIcon className="w-8 h-8 text-primary/60" />
              </div>
              <p className="text-foreground/70 mb-1">Nenhum dado de atividade disponível</p>
              <p className="text-xs text-muted-foreground">
                {selectedDate 
                  ? `Nenhuma atividade registrada em ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}`
                  : "Os dados serão exibidos conforme as mensagens forem enviadas"
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignHourlyActivityCard;