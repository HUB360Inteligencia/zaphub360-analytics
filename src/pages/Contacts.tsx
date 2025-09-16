
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, Filter, Download, Upload, Edit, Trash2, Tag, Users, Phone, Mail, Loader2, Eye, MapPin, Heart } from 'lucide-react';
import { useContacts, Contact } from '@/hooks/useContacts';
import { useTags } from '@/hooks/useTags';
import { useAuth } from '@/contexts/AuthContext';
import ContactProfileModal from '@/components/contacts/ContactProfileModal';

const Contacts = () => {
  const { organization } = useAuth();
  const { contacts, isLoading: contactsLoading, createContact, updateContact, deleteContact } = useContacts();
  const { tags, isLoading: tagsLoading } = useTags();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Filtros novos
  const [filterCidade, setFilterCidade] = useState('all');
  const [filterBairro, setFilterBairro] = useState('all');
  const [filterSentimento, setFilterSentimento] = useState('all');
  
  // Modal de perfil
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'view' | 'edit'>('view');

  // Obter listas únicas para filtros
  const uniqueCidades = Array.from(new Set(contacts.map(c => c.cidade).filter(Boolean))).sort();
  const uniqueBairros = Array.from(new Set(contacts.map(c => c.bairro).filter(Boolean))).sort();
  const uniqueSentimentos = Array.from(new Set(contacts.map(c => c.sentimento).filter(Boolean))).sort();

  // Filtrar contatos baseado na busca e filtros
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = selectedTag === 'all' || 
                      contact.tags?.some(tag => tag.id === selectedTag);
    
    const matchesCidade = filterCidade === 'all' || contact.cidade === filterCidade;
    const matchesBairro = filterBairro === 'all' || contact.bairro === filterBairro;
    const matchesSentimento = filterSentimento === 'all' || contact.sentimento === filterSentimento;
    
    return matchesSearch && matchesTag && matchesCidade && matchesBairro && matchesSentimento;
  });

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const handleCreateContact = async (formData: FormData) => {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const sobrenome = formData.get('sobrenome') as string;
    const cidade = formData.get('cidade') as string;
    const bairro = formData.get('bairro') as string;
    const evento = formData.get('evento') as string;

    if (!name || !phone || !organization?.id) return;

    await createContact.mutateAsync({
      name,
      phone,
      sobrenome,
      cidade,
      bairro,
      evento: evento || 'Contato Manual',
      status: 'active',
      organization_id: organization.id,
    });

    setIsCreateDialogOpen(false);
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
    switch (sentiment) {
      case 'Super Engajado':
        return 'bg-orange-500 text-white';
      case 'Positivo':
        return 'bg-green-500 text-white';
      case 'Neutro':
        return 'bg-gray-500 text-white';
      case 'Negativo':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  // Contadores para estatísticas
  const totalContacts = new_contact_event.length;
  const activeContacts = new_contact_event.filter(c => c.status === 'active').length;
  const contactsWithEmail = new_contact_event.filter(c => c.email).length;
  const totalTags = tags.length;

  if (contactsLoading || tagsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Carregando contatos...</p>
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
                <p className="text-2xl font-bold text-slate-900">{totalContacts.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-slate-900">{activeContacts}</p>
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
                <p className="text-2xl font-bold text-slate-900">{contactsWithEmail}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Tags Ativas</p>
                <p className="text-2xl font-bold text-slate-900">{totalTags}</p>
              </div>
              <Tag className="w-8 h-8 text-orange-600" />
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
              Todos ({totalContacts})
            </Button>
            {tags.map(tag => {
              const tagContactCount = contacts.filter(contact => 
                contact.tags?.some(t => t.id === tag.id)
              ).length;
              
              return (
                <Button
                  key={tag.id}
                  variant={selectedTag === tag.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(tag.id)}
                  className={selectedTag === tag.id ? '' : 'hover:bg-slate-50'}
                  style={selectedTag === tag.id ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name} ({tagContactCount})
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
                  placeholder="Buscar por nome, telefone ou email..."
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
            
            {/* Novos Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filterCidade} onValueChange={setFilterCidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {uniqueCidades.map(cidade => (
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
                  {uniqueBairros.map(bairro => (
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
                  {uniqueSentimentos.map(sentimento => (
                    <SelectItem key={sentimento} value={sentimento}>{sentimento}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">
              Contatos ({filteredContacts.length})
            </CardTitle>
            {selectedContacts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">
                  {selectedContacts.length} selecionados
                </span>
                <Button size="sm" variant="outline">
                  <Tag className="w-4 h-4 mr-2" />
                  Adicionar Tag
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead>Sentimento</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={() => handleSelectContact(contact.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {contact.name}
                    {contact.sobrenome && <span className="text-muted-foreground"> {contact.sobrenome}</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{contact.phone}</TableCell>
                  <TableCell>{contact.cidade || '-'}</TableCell>
                  <TableCell>{contact.bairro || '-'}</TableCell>
                  <TableCell>
                    {contact.sentimento ? (
                      <Badge className={getSentimentColor(contact.sentimento)}>
                        {contact.sentimento}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{contact.evento || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={contact.status === 'active' ? 'default' : 'secondary'}>
                      {contact.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {new Date(contact.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewProfile(contact)}
                        title="Ver perfil"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditProfile(contact)}
                        title="Editar contato"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredContacts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">Nenhum contato encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Perfil */}
      <ContactProfileModal
        contact={selectedContact}
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onUpdate={handleUpdateContact}
        mode={profileModalMode}
      />
    </div>
  );
};

export default Contacts;
