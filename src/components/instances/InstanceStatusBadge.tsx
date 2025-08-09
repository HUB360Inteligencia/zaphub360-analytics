import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface InstanceStatusBadgeProps {
  status: string;
  showIcon?: boolean;
}

export function InstanceStatusBadge({ status, showIcon = true }: InstanceStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: 'Ativo',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900/20 dark:text-green-400',
          icon: <Wifi className="h-3 w-3" />
        };
      case 'inactive':
        return {
          label: 'Inativo',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-300',
          icon: <WifiOff className="h-3 w-3" />
        };
      case 'blocked':
        return {
          label: 'Bloqueado',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900/20 dark:text-red-400',
          icon: <AlertCircle className="h-3 w-3" />
        };
      default:
        return {
          label: 'Desconhecido',
          variant: 'outline' as const,
          className: '',
          icon: <WifiOff className="h-3 w-3" />
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
      {showIcon && config.icon}
      {config.label}
    </Badge>
  );
}