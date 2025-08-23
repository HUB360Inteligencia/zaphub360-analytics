export interface EventAnalytics {
  totalMessages: number;
  deliveredMessages: number;
  readMessages: number;
  responseMessages: number;
  errorMessages: number;
  queuedMessages: number;
}

export function computeEventStatus(analytics?: EventAnalytics): string {
  if (!analytics || analytics.totalMessages === 0) {
    return 'draft';
  }

  // Progress = total - queued (unified logic)
  const processedMessages = analytics.totalMessages - analytics.queuedMessages;
  
  // Se ainda há mensagens na fila
  if (analytics.queuedMessages > 0) {
    return 'sending';
  }

  // Se todas as mensagens falharam e nenhuma foi entregue
  if (analytics.errorMessages > 0 && analytics.deliveredMessages === 0) {
    return 'failed';
  }

  // Se todas as mensagens foram processadas
  return 'completed';
}

export function getStatusBadgeConfig(status: string) {
  const statusConfig = {
    draft: { 
      label: 'Rascunho', 
      variant: 'outline' as const, 
      className: 'text-muted-foreground' 
    },
    sending: { 
      label: 'Enviando', 
      variant: 'default' as const, 
      className: 'bg-blue-500/10 text-blue-600 border-blue-200' 
    },
    active: { 
      label: 'Ativo', 
      variant: 'default' as const, 
      className: 'bg-primary/10 text-primary' 
    },
    completed: { 
      label: 'Concluído', 
      variant: 'secondary' as const, 
      className: 'bg-green-500/10 text-green-600 border-green-200' 
    },
    failed: { 
      label: 'Falhado', 
      variant: 'destructive' as const, 
      className: 'bg-red-500/10 text-red-600 border-red-200' 
    },
    cancelled: { 
      label: 'Cancelado', 
      variant: 'destructive' as const, 
      className: 'bg-destructive/10 text-destructive' 
    },
  };
  
  return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
}