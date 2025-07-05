import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, MapPin, MoreHorizontal, Eye, Edit, Trash2, ExternalLink, Send } from 'lucide-react';
import { useEventContacts } from '@/hooks/useEventContacts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Event {
  id: string;
  event_id: string;
  name: string;
  status: string;
  event_date: string | null;
  location: string | null;
  message_text: string;
  message_image: string | null;
  created_at: string;
}

interface EventCardProps {
  event: Event;
  onDelete: (eventId: string) => void;
}

const EventCard = ({ event, onDelete }: EventCardProps) => {
  const { getContactStats } = useEventContacts(event.id);
  const stats = getContactStats();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'outline' as const, className: 'text-muted-foreground' },
      active: { label: 'Ativo', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      completed: { label: 'Concluído', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getProgressPercentage = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.enviado / stats.total) * 100);
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      onDelete(event.id);
    }
  };

  return (
    <Card className="bg-card border-border hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground line-clamp-1">
              {event.name}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              ID: {event.event_id}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/events/${event.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/events/${event.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="w-4 h-4 mr-2" />
                Link de Disparo
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex justify-between items-center">
          {getStatusBadge(event.status)}
          <span className="text-xs text-muted-foreground">
            {format(new Date(event.created_at), 'dd/MM/yy', { locale: ptBR })}
          </span>
        </div>

        {/* Progress Bar */}
        {stats.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {stats.enviado} de {stats.total} enviados
              </span>
              <span className="text-sm text-muted-foreground">
                ({getProgressPercentage()}%)
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        )}

        {/* Event Details */}
        <div className="space-y-2">
          {event.event_date && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              {format(new Date(event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          )}
          {event.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
        </div>

        {/* Message Preview */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.message_text}
          </p>
          {event.message_image && (
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">📷 Imagem anexada</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link to={`/events/${event.id}`}>
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link to={`/events/${event.id}/edit`}>
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;