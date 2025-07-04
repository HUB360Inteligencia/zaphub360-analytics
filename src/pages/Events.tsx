import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, MapPin, MoreHorizontal, Plus, Search, Filter, Eye, Edit, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Events = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { events, isLoading, deleteEvent } = useEvents();

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const handleDelete = async (eventId: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      deleteEvent.mutate(eventId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Eventos</h1>
          <p className="text-muted-foreground">Gerencie seus eventos e campanhas de disparo</p>
        </div>
        <Link to="/events/new">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, ID ou local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="bg-card border-border hover:shadow-md transition-shadow">
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
                        onClick={() => handleDelete(event.id)}
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
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Nenhum evento encontrado' : 'Nenhum evento criado'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie seu primeiro evento para começar a enviar mensagens'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link to="/events/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Evento
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Events;