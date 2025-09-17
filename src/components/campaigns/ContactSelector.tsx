
import { useState, useEffect } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useTags } from '@/hooks/useTags';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Filter, X } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
}

interface ContactSelectorProps {
  selectedContacts: Contact[];
  onContactsChange: (contacts: Contact[]) => void;
}

export const ContactSelector = ({ selectedContacts, onContactsChange }: ContactSelectorProps) => {
  const { contacts, isLoading } = useContacts();
  const { tags } = useTags();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    // Para filtro por tag, seria necessário implementar a relação contact_tags
    return matchesSearch && matchesStatus;
  });

  const handleSelectContact = (contact: Contact) => {
    const isSelected = selectedContacts.some(c => c.id === contact.id);
    if (isSelected) {
      onContactsChange(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      onContactsChange([...selectedContacts, contact]);
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      onContactsChange([]);
    } else {
      onContactsChange(filteredContacts);
    }
  };

  const clearSelection = () => {
    onContactsChange([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando contatos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Selecionar Contatos
        </CardTitle>
        <CardDescription>
          Escolha os contatos que receberão esta campanha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
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

        {/* Controles de seleção */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedContacts.length === filteredContacts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
            {selectedContacts.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
          <Badge variant="secondary">
            {selectedContacts.length} de {filteredContacts.length} selecionados
          </Badge>
        </div>

        {/* Lista de contatos */}
        <div className="max-h-96 overflow-y-auto border rounded-lg">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum contato encontrado</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredContacts.map((contact) => {
                const isSelected = selectedContacts.some(c => c.id === contact.id);
                return (
                  <div
                    key={contact.id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectContact(contact)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectContact(contact)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.phone}</div>
                      {contact.email && (
                        <div className="text-sm text-gray-500">{contact.email}</div>
                      )}
                    </div>
                    <Badge
                      variant={contact.status === 'active' ? 'default' : 'secondary'}
                    >
                      {contact.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumo da seleção */}
        {selectedContacts.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>{selectedContacts.length} contatos selecionados</strong>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Esses contatos receberão as mensagens quando a campanha for ativada
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
