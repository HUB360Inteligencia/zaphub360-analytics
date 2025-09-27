import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Edit, Trash2, Eye, MapPin, Heart, Loader2 } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  cidade?: string;
  bairro?: string;
  sobrenome?: string;
  sentimento?: string;
  tags?: Array<{ id: string; name: string; color: string }>;
  eventos?: string;
}

interface ContactsTableProps {
  contacts: Contact[];
  selectedContacts: string[];
  onSelectContact: (contactId: string) => void;
  onSelectAll: () => void;
  onViewProfile: (contact: Contact) => void;
  onEditProfile: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  getSentimentColor: (sentiment?: string) => string;
  currentPage: number;
  pageSize: number;
  totalContacts: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading: boolean;
}

const ContactsTable = ({
  contacts,
  selectedContacts,
  onSelectContact,
  onSelectAll,
  onViewProfile,
  onEditProfile,
  onDeleteContact,
  getSentimentColor,
  currentPage,
  pageSize,
  totalContacts,
  onPageChange,
  onPageSizeChange,
  isLoading
}: ContactsTableProps) => {
  // Calculate pagination display values
  const totalPages = Math.ceil(totalContacts / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalContacts);

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Lista de Contatos</CardTitle>
        <CardDescription>
          {totalContacts.toLocaleString()} contatos encontrados - Página {currentPage} de {totalPages}
          {selectedContacts.length > 0 && ` (${selectedContacts.length} selecionados)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Bulk Actions */}
        {selectedContacts.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedContacts.length} contatos selecionados
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Exportar Selecionados
                </Button>
                <Button variant="destructive" size="sm">
                  Excluir Selecionados
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Mostrar:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
                <SelectItem value="2000">2000</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-600">por página</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              Anterior
            </Button>
            <span className="text-sm text-slate-600">
              {startIndex + 1}-{endIndex} de {totalContacts.toLocaleString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || isLoading}
            >
              Próximo
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={contacts.length > 0 && selectedContacts.length === contacts.length}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead>Sentimento</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-slate-500">Carregando contatos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    Nenhum contato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={() => onSelectContact(contact.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-slate-900">{contact.name}</div>
                        {contact.sobrenome && (
                          <div className="text-sm text-slate-500">{contact.sobrenome}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-mono">{contact.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{contact.cidade || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{contact.bairro || '-'}</span>
                  </TableCell>
                  <TableCell>
                    {contact.sentimento && (
                      <Badge className={`text-xs ${getSentimentColor(contact.sentimento)}`}>
                        {contact.sentimento}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags?.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.eventos && (
                        <Badge variant="outline" className="text-xs">
                          <Heart className="w-3 h-3 mr-1" />
                          {contact.eventos.split(', ').length} eventos
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewProfile(contact)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditProfile(contact)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteContact(contact.id)}
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
      </CardContent>
    </Card>
  );
};

export default ContactsTable;