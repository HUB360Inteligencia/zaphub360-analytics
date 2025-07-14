
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Download, Trash2, Users, TrendingUp } from 'lucide-react';
import { useEventContacts } from '@/hooks/useEventContacts';
import EventContactsImport from './EventContactsImport';
import SentimentSelect from './SentimentSelect';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventContactsListProps {
  eventId: string;
  eventName: string;
}

const contactSchema = z.object({
  contact_phone: z.string().min(10, 'Número deve ter pelo menos 10 dígitos'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const EventContactsList = ({ eventId, eventName }: EventContactsListProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [sentimentFilter, setSentimentFilter] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { contacts, isLoading, createEventContact, deleteEventContact, updateContactSentiment, getContactStats } = useEventContacts(eventId);
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contact_phone: '',
    },
  });

  const stats = getContactStats();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      fila: { label: 'Fila', variant: 'outline' as const, className: 'text-muted-foreground' },
      pendente: { label: 'Pendente', variant: 'outline' as const, className: 'text-muted-foreground' },
      enviado: { label: 'Enviado', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      lido: { label: 'Lido', variant: 'default' as const, className: 'bg-purple-100 text-purple-800' },
      respondido: { label: 'Respondido', variant: 'default' as const, className: 'bg-emerald-100 text-emerald-800' },
      erro: { label: 'Erro', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null;
    
    const sentimentConfig = {
      super_engajado: { label: 'Super Engajado', emoji: '🔥', className: 'bg-orange-100 text-orange-800' },
      positivo: { label: 'Positivo', emoji: '😊', className: 'bg-green-100 text-green-800' },
      neutro: { label: 'Neutro', emoji: '😐', className: 'bg-gray-100 text-gray-800' },
      negativo: { label: 'Negativo', emoji: '😞', className: 'bg-red-100 text-red-800' },
    };
    
    const config = sentimentConfig[sentiment as keyof typeof sentimentConfig];
    if (!config) return null;
    
    return (
      <Badge variant="outline" className={config.className}>
        <span className="mr-1">{config.emoji}</span>
        {config.label}
      </Badge>
    );
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !search || 
      contact.contact_phone?.includes(search);
    
    const matchesStatus = statusFilter === 'todos' || contact.status === statusFilter;
    const matchesSentiment = sentimentFilter === 'todos' || contact.sentiment === sentimentFilter;
    
    return matchesSearch && matchesStatus && matchesSentiment;
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      await createEventContact.mutateAsync({
        celular: data.contact_phone,
        evento: eventName,
        event_id: eventId,
        responsavel_cadastro: 'manual'
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating contact:', error);
    }
  };

  const exportContacts = () => {
    const csvContent = [
      ['Telefone', 'Status', 'Sentimento', 'Responsável', 'Data Cadastro'].join(','),
      ...filteredContacts.map(contact => [
        contact.contact_phone || '',
        contact.status,
        contact.sentiment || '',
        contact.contact_name || '',
        format(new Date(contact.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contatos-${eventName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando contatos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {Object.entries(stats)
          .filter(([key]) => key !== 'total')
          .map(([status, count]) => (
            <Card key={status}>
              <CardContent className="p-4">
                <div>
                  <p className="text-xs text-muted-foreground capitalize">{status}</p>
                  <p className="text-lg font-bold">{count}</p>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Sentiment Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <div>
                <p className="text-xs text-muted-foreground">Super Engajado</p>
                <p className="text-lg font-bold text-orange-600">{stats.superEngajado}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">😊</span>
              <div>
                <p className="text-xs text-muted-foreground">Positivo</p>
                <p className="text-lg font-bold text-green-600">{stats.positivo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">😐</span>
              <div>
                <p className="text-xs text-muted-foreground">Neutro</p>
                <p className="text-lg font-bold text-gray-600">{stats.neutro}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">😞</span>
              <div>
                <p className="text-xs text-muted-foreground">Negativo</p>
                <p className="text-lg font-bold text-red-600">{stats.negativo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contatos do Evento</CardTitle>
              <CardDescription>
                Gerencie os contatos cadastrados para este evento
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <EventContactsImport eventId={eventId} eventName={eventName} />
              <Button variant="outline" size="sm" onClick={exportContacts}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Contato</DialogTitle>
                    <DialogDescription>
                      Adicione um novo contato para este evento
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="contact_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(41) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={createEventContact.isPending}
                        >
                          {createEventContact.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="fila">Fila</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="lido">Lido</SelectItem>
                <SelectItem value="respondido">Respondido</SelectItem>
                <SelectItem value="erro">Erro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sentimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Sentimentos</SelectItem>
                <SelectItem value="super_engajado">🔥 Super Engajado</SelectItem>
                <SelectItem value="positivo">😊 Positivo</SelectItem>
                <SelectItem value="neutro">😐 Neutro</SelectItem>
                <SelectItem value="negativo">😞 Negativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sentimento</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {search || statusFilter !== 'todos' || sentimentFilter !== 'todos'
                        ? 'Nenhum contato encontrado com os filtros aplicados'
                        : 'Nenhum contato cadastrado ainda'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        {contact.contact_phone || 'Sem telefone'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(contact.status)}
                      </TableCell>
                      <TableCell>
                        <SentimentSelect
                          value={contact.sentiment}
                          onValueChange={(sentiment) => 
                            updateContactSentiment.mutate({ 
                              contactId: contact.id, 
                              sentiment 
                            })
                          }
                          disabled={updateContactSentiment.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.contact_name || 'Sistema'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(contact.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEventContact.mutate(contact.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventContactsList;
