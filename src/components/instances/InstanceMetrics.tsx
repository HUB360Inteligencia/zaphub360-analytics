import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface InstanceMetricsProps {
  metrics: {
    total: number;
    active: number;
    inactive: number;
    blocked: number;
  };
}

export function InstanceMetrics({ metrics }: InstanceMetricsProps) {
  const cards = [
    {
      title: 'Total',
      value: metrics.total,
      icon: Server,
      description: 'Instâncias cadastradas',
      className: 'border-l-4 border-l-primary',
    },
    {
      title: 'Ativas',
      value: metrics.active,
      icon: Wifi,
      description: 'Em funcionamento',
      className: 'border-l-4 border-l-green-500',
    },
    {
      title: 'Inativas',
      value: metrics.inactive,
      icon: WifiOff,
      description: 'Desativadas',
      className: 'border-l-4 border-l-gray-500',
    },
    {
      title: 'Bloqueadas',
      value: metrics.blocked,
      icon: AlertCircle,
      description: 'Com problemas',
      className: 'border-l-4 border-l-red-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className={card.className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}