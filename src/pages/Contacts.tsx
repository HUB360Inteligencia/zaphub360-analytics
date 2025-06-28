
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
import { Search, Plus, Filter, Download, Upload, Edit, Trash2, Tag, Users, Phone, Mail } from 'lucide-react';

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Mock data - em produção seria do Supabase
  const tags = [
    { id: 'eleitores', name: 'Eleitores', color: '#2563EB', count: 4800 },
    { id: 'apoiadores', name: 'Apoiadores', color: '#7C3AED', count: 3200 },
    { id: 'liderancas', name: 'Lideranças', color: '#DC2626', count: 2100 },
    { id: 'midia', name: 'Mídia', color: '#059669', count: 890 },
    { id: 'empresarios', name: 'Empresários', color: '#D97706', count: 675 }
  ];

  const contacts = [
    {
      id: 1,
      name: 'João Silva',
      phone: '(11) 99999-1234',
      email: 'joao@email.com',
      company: 'Empresa ABC',
      tags: ['eleitores', 'apoiadores'],
      status: 'Ativo',
      lastContact: '2024-01-15',
      createdAt: '2024-01-10'
    },
    {
      id: 2,
      name: 'Maria Santos',
      phone: '(11) 88888-5678',
      email: 'maria@email.com',
      company: 'Prefeitura Local',
      tags: ['liderancas'],
      status: 'Ativo',
      lastContact: '2024-01-14',
      createdAt: '2024-01-08'
    },
    {
      id: 3,
      name: 'Carlos Oliveira',
      phone: '(11) 77777-9012',
      email: 'carlos@jornal.com',
      company: 'Jornal da Cidade',
      tags: ['midia'],
      status: 'Ativo',
      lastContact: '2024-01-13',
      createdAt: '2024-01-05'
    },
    {
      id: 4,
      name: 'Ana Costa',
      phone: '(11) 66666-3456',
      email: 'ana@loja.com',
      company: 'Loja do Bairro',
      tags: ['empresarios', 'apoiadores'],
      status: 'Inativo',
      lastContact: '2024-01-10',
      createdAt: '2024-01-03'
    }
  ];

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'all' || contact.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleSelectContact = (contactId: number) => {
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

  const getTagById = (tagId: string) => tags.find(tag => tag.id === tagId);

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" placeholder="Nome completo" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Input id="company" placeholder="Nome da empresa" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox id={tag.id} />
                        <Label htmlFor={tag.id} className="text-sm">{tag.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" placeholder="Observações sobre o contato..." className="mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button>Salvar Contato</Button>
              </div>
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
                <p className="text-2xl font-bold text-slate-900">{contacts.length.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-slate-900">
                  {contacts.filter(c => c.status === 'Ativo').length}
                </p>
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
                <p className="text-2xl font-bold text-slate-900">
                  {contacts.filter(c => c.email).length}
                </p>
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
                <p className="text-2xl font-bold text-slate-900">{tags.length}</p>
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
              Todos ({contacts.length})
            </Button>
            {tags.map(tag => (
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-6">
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
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
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
                    checked={selectedContacts.length === filteredContacts.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead className="w-16">Ações</TableHead>
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
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell className="font-mono text-sm">{contact.phone}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.company}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map(tagId => {
                        const tag = getTagById(tagId);
                        return tag ? (
                          <Badge
                            key={tagId}
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: tag.color, color: tag.color }}
                          >
                            {tag.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.status === 'Ativo' ? 'default' : 'secondary'}>
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {new Date(contact.lastContact).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contacts;
