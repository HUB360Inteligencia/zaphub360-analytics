export type CampaignBaseStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'cancelled'
  | 'completed';

export type CampaignDerivedStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'paused'
  | 'cancelled'
  | 'failed'
  | 'completed';

export interface CampaignAnalytics {
  totalMessages: number;
  queuedMessages: number;
  sentMessages: number; // enviados processados (inclui entregues/erros conforme fonte)
}

export function computeCampaignStatus(
  analytics: CampaignAnalytics | undefined,
  baseStatus?: CampaignBaseStatus | string
): CampaignDerivedStatus {
  const total = analytics?.totalMessages ?? 0;
  const queued = analytics?.queuedMessages ?? 0;
  const sent = analytics?.sentMessages ?? 0;

  const normalizedBase = (baseStatus ?? 'draft') as CampaignBaseStatus;

  if (total <= 0) {
    // Sem mensagens: manter estado base exceto se cancelada
    if (normalizedBase === 'cancelled') return 'cancelled';
    if (normalizedBase === 'completed') return 'completed';
    if (normalizedBase === 'paused') return 'paused';
    if (normalizedBase === 'scheduled') return 'scheduled';
    return 'draft';
  }

  // Se tiver mensagens restantes em fila
  if (queued > 0) {
    // Cancelada sempre prevalece
    if (normalizedBase === 'cancelled') return 'cancelled';
    // Pausada prevalece sobre envio
    if (normalizedBase === 'paused') return 'paused';
    // Agendada antes de começar a enviar
    if (normalizedBase === 'scheduled') return 'scheduled';
    // Caso contrário, está enviando
    return 'sending';
  }

  // Sem fila e há mensagens processadas
  if (sent >= total) {
    // Concluída quando tudo foi processado
    return normalizedBase === 'cancelled' ? 'cancelled' : 'completed';
  }

  // Sem fila mas não bateu total (pode indicar falha/drift)
  // Se a base for cancelada, manter cancelada; senão considerar falha
  return normalizedBase === 'cancelled' ? 'cancelled' : 'failed';
}

export function getCampaignStatusBadgeConfig(status: CampaignDerivedStatus): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
} {
  switch (status) {
    case 'draft':
      return { label: 'Rascunho', variant: 'secondary' };
    case 'scheduled':
      return { label: 'Agendada', variant: 'secondary' };
    case 'sending':
      return { label: 'Enviando', variant: 'default' };
    case 'paused':
      return { label: 'Pausada', variant: 'secondary' };
    case 'cancelled':
      return { label: 'Cancelada', variant: 'outline' };
    case 'failed':
      return { label: 'Falhada', variant: 'destructive' };
    case 'completed':
      return { label: 'Concluído', variant: 'secondary', className: 'bg-green-500/10 text-green-600 border-green-200' };
    default:
      return { label: 'Desconhecida', variant: 'outline' };
  }
}