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
    respondidos: number;
  }>;
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

const CampaignHourlyActivityCard = ({
  hourlyActivity,
  selectedDate,
  onDateChange,
}: CampaignHourlyActivityCardProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const hasData = hourlyActivity.some(
    (item) => item.enviados > 0 || item.respondidos > 0,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-medium">Atividade por Horário</CardTitle>
          <CardDescription>
            Distribuição de mensagens enviadas e respondidas ao longo do dia
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate
                  ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                  : "Todos os dias"}
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
                initialFocus
                locale={ptBR}
              />
              <div className="border-t p-2">
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
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={hourlyActivity}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                labelStyle={{ color: "hsl(var(--foreground))" }}
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              <Bar
                dataKey="enviados"
                name="Enviados"
                fill="#FF6B35"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="respondidos"
                name="Respondidos"
                fill="#10B981"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-80 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BarChartIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mb-1">Nenhum dado de atividade disponível</p>
              <p className="text-xs text-muted-foreground">
                {selectedDate
                  ? `Nenhuma atividade registrada em ${format(selectedDate, "dd/MM/yyyy", {
                      locale: ptBR,
                    })}`
                  : "Os dados serão exibidos conforme as mensagens forem enviadas"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignHourlyActivityCard;