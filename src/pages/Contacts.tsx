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
import { SENTIMENT_OPTIONS, getSentimentOption } from '@/lib/sentiment';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'view' | 'edit'>('view');

  // Debounce da busca para evitar muitas consultas
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Hook de contatos com parâmetros atualizados
  const { 
    contacts, 
    contactsCount, 
    stats, 
    filters,
    isLoading: contactsLoading, 
    createContact, 
    updateContact, 
    deleteContact 
  } = useContacts({
    page: currentPage,
    pageSize,
    searchTerm: debouncedSearchTerm,
    filterCidade,
    filterBairro,
    filterSentimento,
    selectedTag
  });

  // Calcular estatísticas para as tags
  const tagStats = useMemo(() => {
    return tags.map(tag => ({
      ...tag,
      count: contacts.filter(contact => 
        contact.tags?.some(t => t.name === tag.name)
      ).length
    }));
  }, [tags, contacts]);

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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedContacts([]); // Limpar seleção ao mudar página
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Voltar para primeira página
    setSelectedContacts([]); // Limpar seleção
  };

  const [messageType, setMessageType] = useState<number>(1);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const handleCreateContact = async (formData: FormData) => {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const sobrenome = formData.get('sobrenome') as string;
    const cidade = formData.get('cidade') as string;
    const bairro = formData.get('bairro') as string;
    const evento = formData.get('evento') as string;

    if (!name || !phone || !organization?.id) return;
    if (messageType === 2 && !mediaFile) {
      alert('Por favor, selecione um arquivo para o tipo "Arquivo + Texto"');
      return;
    }

    await createContact.mutateAsync({
      name,
      phone,
      sobrenome,
      cidade,
      bairro,
      evento: evento || 'Contato Manual',
      status: 'active',
      organization_id: organization.id,
      id_tipo_mensagem: messageType,
      mediaFile: mediaFile || undefined,
    });

    setIsCreateDialogOpen(false);
    setMessageType(1);
    setMediaFile(null);
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

  const handleUpdateContact = async (updatedContact: Contact) => {
    await updateContact.mutateAsync(updatedContact);
    setProfileModalOpen(false);
  };

  const getSentimentColor = (sentiment?: string) => {
    const sentimentOption = getSentimentOption(sentiment);
    return sentimentOption?.color || 'bg-gray-200 text-gray-700';
  };

  if (tagsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Contatos</h1>
          <p className="text-slate-600">Organize e gerencie sua base de contatos</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white">
                <Upload className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Importar Contatos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Arquivo CSV</Label>
                  <Input id="csv-file" type="file" accept=".csv" className="mt-1" />
                  <p className="text-xs text-slate-600 mt-1">
                    Formato: Nome, Telefone, Email, Empresa, Tags
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button>Importar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Contato</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateContact(formData);
              }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input id="name" name="name" placeholder="Nome" className="mt-1" required />
                    </div>
                    <div>
                      <Label htmlFor="sobrenome">Sobrenome</Label>
                      <Input id="sobrenome" name="sobrenome" placeholder="Sobrenome" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input id="phone" name="phone" placeholder="(11) 99999-9999" className="mt-1" required />
                    </div>
                    <div>
                      <Label htmlFor="evento">Evento</Label>
                      <Input id="evento" name="evento" placeholder="Nome do evento" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input id="cidade" name="cidade" placeholder="Cidade" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input id="bairro" name="bairro" placeholder="Bairro" className="mt-1" />
                    </div>
                  </div>

                  <div>
                    <Label>Tipo de Mensagem *</Label>
                    <Select value={messageType.toString()} onValueChange={(value) => setMessageType(parseInt(value))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o tipo de mensagem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Texto</SelectItem>
                        <SelectItem value="2">Arquivo + Texto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {messageType === 2 && (
                    <div>
                      <Label htmlFor="media">Arquivo *</Label>
                      <Input 
                        id="media" 
                        type="file" 
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        className="mt-1" 
                        onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-slate-600 mt-1">
                        Aceita imagens, vídeos e documentos (PDF, DOC, DOCX)
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createContact.isPending}>
                    {createContact.isPending ? 'Salvando...' : 'Salvar Contato'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Contatos</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Contatos Ativos</p>
                <p className="text-2xl font-bold text-slate-900">{stats.active.toLocaleString()}</p>
              </div>
              <Phone className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Com Email</p>
                <p className="text-2xl font-bold text-slate-900">{stats.withEmail.toLocaleString()}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Resultados</p>
                <p className="text-2xl font-bold text-slate-900">{contactsCount.toLocaleString()}</p>
              </div>
              <Filter className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags Filter */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTag('all')}
              className={selectedTag === 'all' ? 'bg-slate-900' : ''}
            >
              Todos ({stats.total.toLocaleString()})
            </Button>
            {tagStats.map(tag => {
              return (
                <Button
                  key={tag.id}
                  variant={selectedTag === tag.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(tag.id)}
                  className={selectedTag === tag.id ? '' : 'hover:bg-slate-50'}
                  style={selectedTag === tag.id ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name} ({tag.count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-white border-0 shadow-sm">
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
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
            
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filterCidade} onValueChange={setFilterCidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {filters.cidades.map(cidade => (
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
                  {filters.bairros.map(bairro => (
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
                  {SENTIMENT_OPTIONS.slice(1).map(option => (
                    <SelectItem key={option.value} value={option.label}>{option.label}</SelectItem>
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