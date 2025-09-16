import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Check, X, Info } from 'lucide-react';
import { FilterPanel } from './FilterPanel';
import { useAdvancedContactFilter, FilterOptions, ContactWithDetails } from '@/hooks/useAdvancedContactFilter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdvancedContactSelectorProps {
  selectedContacts: ContactWithDetails[];
  onContactsChange: (contacts: ContactWithDetails[]) => void;
  useFiltersAsSelection?: boolean; // Novo prop para usar filtros como seleção
}

// Inicializar filtros fora do componente para evitar recriação
const initialFilters: FilterOptions = {
  sentiments: [],
  cidades: [],
  bairros: [],
  includeEvents: [],
  excludeEvents: [],
  includeCampaigns: [],
  excludeCampaigns: [],
  includeTags: [],
  excludeTags: [],
};

export const AdvancedContactSelector: React.FC<AdvancedContactSelectorProps> = ({
  selectedContacts,
  onContactsChange,
  useFiltersAsSelection = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const {
    filteredContacts,
    filterData,
    events,
    campaigns,
    tags,
    totalContacts,
    filteredCount,
  } = useAdvancedContactFilter(filters);

  // Cast para resolver problemas de tipo com status
  const eventsTyped = events as any[];
  const campaignsTyped = campaigns as any[];

  // Filtrar por busca de texto
  const searchFilteredContacts = filteredContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chaves estáveis para comparar seleções e evitar loops
  const selectionIdsKey = useMemo(() => searchFilteredContacts.map(c => c.id).sort().join(','), [searchFilteredContacts]);
  const selectedIdsKey = useMemo(() => selectedContacts.map(c => c.id).sort().join(','), [selectedContacts]);

  const handleSelectContact = (contact: ContactWithDetails) => {
    const isSelected = selectedContacts.some(c => c.id === contact.id);
    if (isSelected) {
      onContactsChange(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      onContactsChange([...selectedContacts, contact]);
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === searchFilteredContacts.length) {
      onContactsChange([]);
    } else {
      onContactsChange(searchFilteredContacts as any[]);
    }
  };

  const clearSelection = () => {
    onContactsChange([]);
  };

  // Verificar se há filtros aplicados
  const hasFiltersApplied = Object.values(filters).some(filterArray => 
    Array.isArray(filterArray) && filterArray.length > 0
  );

  // Usar contatos filtrados automaticamente quando há filtros aplicados, evitando loops
  useEffect(() => {
    if (useFiltersAsSelection && hasFiltersApplied) {
      if (selectionIdsKey !== selectedIdsKey) {
        onContactsChange(searchFilteredContacts as any[]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionIdsKey, selectedIdsKey, hasFiltersApplied, useFiltersAsSelection]);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Painel de Filtros */}
      <div className="lg:col-span-1">
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          filterData={filterData}
          events={eventsTyped}
          campaigns={campaignsTyped}
          tags={tags}
          filteredCount={filteredCount}
          totalContacts={totalContacts}
        />
      </div>

      {/* Lista de Contatos */}
      <div className="lg:col-span-2">
        {useFiltersAsSelection && hasFiltersApplied && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Modo automático ativado: todos os contatos que atendem aos filtros serão selecionados automaticamente.
              {selectedContacts.length} contatos selecionados pelos filtros aplicados.
            </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Seleção de Contatos
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={searchFilteredContacts.length === 0}
                >
                  {selectedContacts.length === searchFilteredContacts.length ? (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Desmarcar Todos
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Selecionar Todos
                    </>
                  )}
                </Button>
                {selectedContacts.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-muted-foreground"
                  >
                    Limpar Seleção
                  </Button>
                )}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedContacts.length} contatos selecionados de {searchFilteredContacts.length} encontrados
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchFilteredContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum contato encontrado com os filtros aplicados</p>
                </div>
              ) : (
                searchFilteredContacts.map((contact) => {
                  const isSelected = selectedContacts.some(c => c.id === contact.id);
                  return (
                    <div
                      key={contact.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent ${
                        isSelected ? 'bg-accent border-primary' : 'border-border'
                      }`}
                      onClick={() => handleSelectContact(contact as any)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectContact(contact as any)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contact.avatar_url} />
                        <AvatarFallback>
                          {contact.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{contact.name}</p>
                          {contact.sentiment && (
                            <Badge className={`text-xs ${getSentimentColor(contact.sentiment)}`}>
                              {contact.sentiment}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                          <span>{contact.phone}</span>
                          {contact.email && <span>• {contact.email}</span>}
                        </div>
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contact.tags.map((tag) => (
                              <Badge
                                key={tag.id}
                                style={{ backgroundColor: tag.color }}
                                className="text-white text-xs"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};