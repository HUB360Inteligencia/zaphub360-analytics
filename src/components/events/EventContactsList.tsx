
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Download, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useEventContacts } from '@/hooks/useEventContacts';
import EventContactsImport from './EventContactsImport';
import SentimentSelect from './SentimentSelect';
import ContactProfileModal from '../contacts/ContactProfileModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { normalizeSentiment } from '@/lib/sentiment';

interface EventContactsListProps {
  eventId: string;
  eventName: string;
}

const contactSchema = z.object({
  contact_phone: z.string().min(10, 'Número deve ter pelo menos 10 dígitos'),
});

type ContactFormData = z.infer<typeof contactSchema>;

type SortField = 'status' | 'profile' | 'sentiment' | 'name' | 'created_at';
type SortDirection = 'asc' | 'desc';

const EventContactsList = ({ eventId, eventName }: EventContactsListProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [sentimentFilter, setSentimentFilter] = useState<string>('todos');
  const [profileFilter, setProfileFilter] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContactPhone, setSelectedContactPhone] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
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

  const getSentimentBadge = (sentiment?: string | null) => {
    if (sentiment === null || sentiment === undefined) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          <span className="mr-1">⚪</span>
          Sem classificação
        </Badge>
      );
    }
    
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Get unique profiles for filter
  const uniqueProfiles = Array.from(new Set(contacts.map(c => c.profile).filter(Boolean)));

  const filteredAndSortedContacts = contacts
    .filter(contact => {
      const matchesSearch = !search || 
        contact.contact_phone?.includes(search) ||
        contact.contact_name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || contact.status === statusFilter;
      
      const matchesProfile = profileFilter === 'todos' || contact.profile === profileFilter;
      
      let matchesSentiment = true;
      if (sentimentFilter !== 'todos') {
        if (sentimentFilter === 'sem_classificacao') {
          matchesSentiment = contact.sentiment === null || contact.sentiment === undefined;
        } else {
          const normalizedSentiment = normalizeSentiment(contact.sentiment);
          matchesSentiment = normalizedSentiment === sentimentFilter;
        }
      }
      
      return matchesSearch && matchesStatus && matchesSentiment && matchesProfile;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'profile':
          aValue = a.profile || '';
          bValue = b.profile || '';
          break;
        case 'sentiment':
          aValue = normalizeSentiment(a.sentiment) || '';
          bValue = normalizeSentiment(b.sentiment) || '';
          break;
        case 'name':
          aValue = a.contact_name || '';
          bValue = b.contact_name || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = filteredAndSortedContacts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

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
      ['Telefone', 'Status', 'Sentimento', 'Perfil', 'Nome', 'Data Cadastro'].join(','),
      ...filteredAndSortedContacts.map(contact => [
        contact.contact_phone || '',
        contact.status,
        contact.sentiment || 'Sem classificação',
        contact.profile || 'Sem classificação',
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
      {/* Sentiment Stats Cards - Apenas os com emojis */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <span className="text-lg">⚪</span>
              <div>
                <p className="text-xs text-muted-foreground">Sem classificação</p>
                <p className="text-lg font-bold text-gray-600">{stats.semClassificacao}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">❌</span>
              <div>
                <p className="text-xs text-muted-foreground">Erro</p>
                <p className="text-lg font-bold text-red-600">{stats.erro}</p>
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
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por telefone ou nome..."
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
                <SelectItem value="sem_classificacao">⚪ Sem classificação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={profileFilter} onValueChange={setProfileFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Perfis</SelectItem>
                {uniqueProfiles.map(profile => (
                  <SelectItem key={profile} value={profile}>
                    {profile}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredAndSortedContacts.length)} de {filteredAndSortedContacts.length} contatos
            </div>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 por página</SelectItem>
                <SelectItem value="100">100 por página</SelectItem>
                <SelectItem value="500">500 por página</SelectItem>
                <SelectItem value="1000">1000 por página</SelectItem>
                <SelectItem value="2000">2000 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefone</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 font-medium"
                    >
                      Status {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('sentiment')}
                      className="h-auto p-0 font-medium"
                    >
                      Sentimento {getSortIcon('sentiment')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('profile')}
                      className="h-auto p-0 font-medium"
                    >
                      Perfil {getSortIcon('profile')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('name')}
                      className="h-auto p-0 font-medium"
                    >
                      Nome {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('created_at')}
                      className="h-auto p-0 font-medium"
                    >
                      Data Cadastro {getSortIcon('created_at')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {search || statusFilter !== 'todos' || sentimentFilter !== 'todos' || profileFilter !== 'todos'
                        ? 'Nenhum contato encontrado com os filtros aplicados'
                        : 'Nenhum contato cadastrado ainda'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedContacts.map((contact) => (
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
                        <Badge variant="outline">
                          {contact.profile || 'Sem classificação'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.contact_name || 'Sistema'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(contact.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedContactPhone(contact.contact_phone)}
                            className="text-primary hover:text-primary"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEventContact.mutate(contact.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (page > totalPages) return null;
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal do Perfil de Contato */}
      {selectedContactPhone && (
        <ContactProfileModal
          contactPhone={selectedContactPhone}
          isOpen={!!selectedContactPhone}
          onClose={() => setSelectedContactPhone(null)}
        />
      )}
    </div>
  );
};

export default EventContactsList;
