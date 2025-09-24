import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface HourlyActivityData {
  hour: string;
  enviados: number;
  respondidos: number;
}

interface EventHourlyActivityCardProps {
  hourlyActivity: HourlyActivityData[];
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export const EventHourlyActivityCard = ({ 
  hourlyActivity, 
  selectedDate, 
  onDateChange 
}: EventHourlyActivityCardProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const hasData = hourlyActivity && hourlyActivity.length > 0 && 
    hourlyActivity.some(item => item.enviados > 0 || item.respondidos > 0);

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
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP", { locale: ptBR })
                ) : (
                  <span>Todos os dias</span>
                )}
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
            </PopoverContent>
          </Popover>
          {selectedDate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(undefined)}
              className="h-9 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyActivity} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    background: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};