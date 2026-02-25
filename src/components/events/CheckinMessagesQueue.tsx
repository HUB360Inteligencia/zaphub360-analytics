import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  celular: string;
  mensagem?: string;
  caption_media?: string;
  nome_contato?: string;
  perfil_contato?: string;
  status: string;
  data_envio?: string;
  instancia_id?: string;
  'tempo delay'?: number;
}

interface CheckinMessagesQueueProps {
  messages: Message[];
  isLoading: boolean;
}

const statusConfig = {
  pendente: {
    label: 'Pendente',
    icon: Clock,
    variant: 'secondary' as const,
  },
  processando: {
    label: 'Processando',
    icon: Send,
    variant: 'default' as const,
  },
  enviado: {
    label: 'Enviado',
    icon: CheckCircle2,
    variant: 'default' as const,
  },
  erro: {
    label: 'Erro',
    icon: AlertCircle,
    variant: 'destructive' as const,
  },
};

export function CheckinMessagesQueue({ messages, isLoading }: CheckinMessagesQueueProps) {
  const statusCounts = messages.reduce(
    (acc, msg) => {
      acc[msg.status] = (acc[msg.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fila de Mensagens</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fila de Mensagens</CardTitle>
        <CardDescription>
          Mensagens de check-in aguardando envio pelo n8n
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Summary */}
          <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => {
            const config = statusConfig[status] || statusConfig.pendente;
              const Icon = config.icon;
              return (
                <Badge key={status} variant={config.variant} className="gap-1">
                  <Icon className="h-3 w-3" />
                  {config.label}: {count}
                </Badge>
              );
            })}
          </div>

          {/* Messages List */}
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma mensagem na fila
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {messages.map((message) => {
                  const config = statusConfig[message.status] || statusConfig.pendente;
                  const Icon = config.icon;

                  return (
                    <div
                      key={message.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{message.nome_contato || 'Sem nome'}</p>
                            <p className="font-mono text-sm text-muted-foreground">{message.celular}</p>
                            {message.perfil_contato && (
                              <Badge variant="outline">{message.perfil_contato}</Badge>
                            )}
                            <Badge variant={config.variant} className="gap-1">
                              <Icon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          </div>
                          {message.mensagem && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {message.mensagem}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                          {message.data_envio && (
                            <p className="text-green-600">
                              Enviado:{' '}
                              {format(
                                new Date(message.data_envio),
                                "dd/MM 'às' HH:mm",
                                { locale: ptBR }
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
