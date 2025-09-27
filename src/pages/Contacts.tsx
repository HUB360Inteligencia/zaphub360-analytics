import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, Filter, Download, Upload, Users, Phone, Mail, Loader2 } from 'lucide-react';
import { useContacts, Contact } from '@/hooks/useContacts';
import { useTags } from '@/hooks/useTags';
import { useAuth } from '@/contexts/AuthContext';
import ContactProfileModal from '@/components/contacts/ContactProfileModal';
import ContactsTable from '@/components/contacts/ContactsTable';
import { getSentimentColor } from '@/lib/brazilianStates';
import AdvancedFiltersModal from '@/components/contacts/AdvancedFiltersModal';

// Tipo local para o Contacts.tsx (seu modal não precisa exportar esse tipo)
type AdvancedFilters = {
  searchTerm: string;
  sentiments: string[];
  states: string[];
  cities: string[];
  neighborhoods: string[];
  dateRange: { from: string; to: string };
  tags: string[];
  status: string[];
  searchOperator: 'AND' | 'OR';
};
import { useAdvancedContactFilters } from '@/hooks/useAdvancedContactFilters';
import { useDebounce } from '@/hooks/useDebounce';
import * as XLSX from 'xlsx';

const Contacts = () => {
  const { organization } = useAuth();
  const { tags, isLoading: tagsLoading } = useTags();
  
  // Estados para controles de interface
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Estados para filtros
  const [filterCidade, setFilterCidade] = useState('all');
  const [filterBairro, setFilterBairro] = useState('all');
  const [filterSentimento, setFilterSentimento] = useState('all');
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  // Modal de perfil
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'view' | 'edit'>('view');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // Advanced filters state
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [useAdvancedFilters, setUseAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    searchTerm: '',
    sentiments: [],
    states: [],
    cities: [],
    neighborhoods: [],
    dateRange: { from: '', to: '' },
    tags: [],
    status: [],
    searchOperator: 'AND'
  });

  // Debounce da busca para evitar muitas consultas
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Regular filters
  const regularFilters = useContacts({
    searchTerm: debouncedSearchTerm,
    filterCidade,
    filterBairro,
    filterSentimento,
    selectedTag,
    page: currentPage,
    pageSize: pageSize
  });

  // Advanced filters
  const advancedFiltersResult = useAdvancedContactFilters(
    advancedFilters,
    currentPage,
    pageSize
  );

  // Use appropriate data source based on filter mode
  const {
    contacts,
    contactsCount,
    contactsLoading,
    createContact,
    updateContact,
    deleteContact,
    refetch
  } = useAdvancedFilters ? {
    contacts: advancedFiltersResult.contacts,
    contactsCount: advancedFiltersResult.contactsCount,
    contactsLoading: advancedFiltersResult.contactsLoading,
    createContact: regularFilters.createContact,
    updateContact: regularFilters.updateContact,
    deleteContact: regularFilters.deleteContact,
    refetch: advancedFiltersResult.refetch
  } : {
    contacts: regularFilters.contacts,
    contactsCount: regularFilters.contactsCount,
    contactsLoading: regularFilters.isLoading,
    createContact: regularFilters.createContact,
    updateContact: regularFilters.updateContact,
    deleteContact: regularFilters.deleteContact,
    refetch: regularFilters.refetch
  };

  const filters = useAdvancedFilters ? advancedFiltersResult.filterOptions : regularFilters.filters;
  const filtersLoading = useAdvancedFilters ? advancedFiltersResult.filterOptionsLoading : regularFilters.isFiltersLoading;

  // Estatísticas calculadas com base nos contatos
  const stats = useMemo(() => {
    if (!contacts) return { total: 0, active: 0, withEmail: 0, searchResults: 0 };
    
    return {
      total: contactsCount || 0,
      active: contacts.filter(c => c.status === 'active').length,
      withEmail: contacts.filter(c => c.email).length,
      searchResults: contacts.length
    };
  }, [contacts, contactsCount]);

  // Estatísticas das tags
  const tagStats = useMemo(() => {
    if (!contacts || !tags) return [];
    
    return tags.map(tag => ({
      ...tag,
      count: contacts.filter(contact => 
        contact.tags?.some(contactTag => contactTag.name === tag.name)
      ).length
    }));
  }, [contacts, tags]);

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleCreateContact = async (contactData: any) => {
    try {
      await createContact.mutateAsync(contactData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar contato:', error);
    }
  };

  const handleViewProfile = (contact: Contact) => {
    setSelectedContact(contact);
    setProfileModalMode('view');
    setProfileModalOpen(true);
  };

  const handleEditProfile = (contact: Contact) => {
    setSelectedContact(contact);
    setProfileModalMode('edit');
    setProfileModalOpen(true);
  };

  const handleUpdateContact = async (contactData: Partial<Contact>) => {
    if (!selectedContact) return;
    
    try {
      await updateContact.mutateAsync({ 
        id: selectedContact.id, 
        ...contactData 
      });
      setProfileModalOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
    }
  };

  const handleAdvancedFiltersApply = (newFilters: AdvancedFilters) => {
    setAdvancedFilters(newFilters);
    setUseAdvancedFilters(true);
    setCurrentPage(1); // Reset to first page when applying filters
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({
      searchTerm: '',
      sentiments: [],
      states: [],
      cities: [],
      neighborhoods: [],
      dateRange: { from: '', to: '' },
      tags: [],
      status: [],
      searchOperator: 'AND'
    });
    setUseAdvancedFilters(false);
  };

  const handleExportExcel = () => {
    if (!contacts || contacts.length === 0) return;

    const excelData = contacts.map((contact, index) => ({
      'Linha': index + 1,
      'Nome': contact.name || '',
      'Telefone': contact.phone || '',
      'Email': contact.email || '',
      'Cidade': (contact as any).cidade || '',
      'Bairro': (contact as any).bairro || '',
      'Sentimento': (contact as any).sentimento || '',
      'Evento': (contact as any).evento || '',
      'Tags': Array.isArray(contact.tags) ? contact.tags.map((t: any) => t.name).join(', ') : '',
      'Status': contact.status || '',
      'Data de Cadastro': contact.created_at ? new Date(contact.created_at).toLocaleDateString('pt-BR') : '',
      'Observações': contact.notes || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Contatos Filtrados');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `contatos-filtrados-${dateStr}-${timeStr}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  if (tagsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
          <p className="text-slate-600">
            Gerencie seus contatos e acompanhe o engajamento
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Contatos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Faça upload de um arquivo CSV com os dados dos contatos
                </p>
                <Input type="file" accept=".csv" />
                <Button className="w-full">Importar Arquivo</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Contato</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" placeholder="Nome do contato" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" />
                </div>
                <Button className="w-full" onClick={() => setIsCreateDialogOpen(false)}>
                  Criar Contato
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Contatos</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Contatos Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</p>
              </div>
              <Phone className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Com Email</p>
                <p className="text-2xl font-bold text-purple-600">{stats.withEmail.toLocaleString()}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Resultados da Busca</p>
                <p className="text-2xl font-bold text-orange-600">{stats.searchResults.toLocaleString()}</p>
              </div>
              <Search className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Filtrar por Tags</h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedTag === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedTag('all')}
              >
                Todas ({stats.total})
              </Badge>
              {tagStats.map(tag => (
                <Badge
                  key={tag.id}
                  variant={selectedTag === tag.name ? 'default' : 'outline'}
                  className="cursor-pointer"
                  style={{ backgroundColor: selectedTag === tag.name ? tag.color : undefined }}
                  onClick={() => setSelectedTag(tag.name)}
                >
                  {tag.name} ({tag.count})
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant={useAdvancedFilters ? "default" : "outline"} 
                  className="w-full sm:w-auto"
                  onClick={() => setAdvancedFiltersOpen(true)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros Avançados
                  {useAdvancedFilters && (
                    <Badge variant="secondary" className="ml-2">
                      Ativo
                    </Badge>
                  )}
                </Button>
                {useAdvancedFilters && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearAdvancedFilters}
                  >
                    Limpar Filtros
                  </Button>
                )}
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto"
                    onClick={handleExportExcel}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
              </div>
            </div>
            
            {/* Filtros Simples (apenas quando não está usando filtros avançados) */}
            {!useAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filterCidade} onValueChange={setFilterCidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {filters.cidades?.map(cidade => (
                    <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterBairro} onValueChange={setFilterBairro}>
                <SelectTrigger>
                  <SelectValue placeholder="Bairro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os bairros</SelectItem>
                  {filters.bairros?.map(bairro => (
                    <SelectItem key={bairro} value={bairro}>{bairro}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterSentimento} onValueChange={setFilterSentimento}>
                <SelectTrigger>
                  <SelectValue placeholder="Sentimento" />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os sentimentos</SelectItem>
                    {filters.sentimentos?.map(sentimento => (
                      <SelectItem key={sentimento} value={sentimento}>{sentimento}</SelectItem>
                    ))}
                  </SelectContent>
              </Select>
              
              <Select value="all" onValueChange={() => {}}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <ContactsTable
        contacts={contacts}
        selectedContacts={selectedContacts}
        onSelectContact={handleSelectContact}
        onSelectAll={handleSelectAll}
        onViewProfile={handleViewProfile}
        onEditProfile={handleEditProfile}
        onDeleteContact={(id) => deleteContact.mutate(id)}
        getSentimentColor={getSentimentColor}
        currentPage={currentPage}
        pageSize={pageSize}
        totalContacts={contactsCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={contactsLoading}
      />

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        isOpen={advancedFiltersOpen}
        onClose={() => setAdvancedFiltersOpen(false)}
        filters={advancedFilters}
        onApplyFilters={handleAdvancedFiltersApply}
        contacts={useAdvancedFilters ? advancedFiltersResult.contacts : contacts}
        availableData={{
          sentiments: advancedFiltersResult.filterOptions.sentimentos || [],
          states: advancedFiltersResult.filterOptions.states || [],
          cities: advancedFiltersResult.filterOptions.cidades || [],
          neighborhoods: advancedFiltersResult.filterOptions.bairros || [],
          tags: tagStats.map(tag => tag.name) || [],
          citiesByState: advancedFiltersResult.filterOptions.citiesByState || {},
          neighborhoodsByCity: advancedFiltersResult.filterOptions.neighborhoodsByCity || {},
        }}
      />

      {/* Contact Profile Modal */}
      {selectedContact && (
        <ContactProfileModal
          contact={selectedContact}
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          mode={profileModalMode}
          onUpdate={handleUpdateContact}
        />
      )}
    </div>
  );
};

export default Contacts;