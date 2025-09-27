import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Search, Download } from 'lucide-react';
import { BRAZILIAN_STATES, NORMALIZED_SENTIMENTS } from '@/lib/brazilianStates';
import * as XLSX from 'xlsx';

export interface AdvancedFilters {
  searchTerm: string;
  sentiments: string[];
  states: string[];
  cities: string[];
  neighborhoods: string[];
  dateRange: {
    from: string;
    to: string;
  };
  tags: string[];
  status: string[];
  searchOperator: 'AND' | 'OR';
}

interface AdvancedFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onApplyFilters: (filters: AdvancedFilters) => void;
  availableData: {
    sentiments: string[];
    states: string[];
    cities: string[];
    neighborhoods: string[];
    tags: string[];
    citiesByState: Record<string, string[]>;
    neighborhoodsByCity: Record<string, string[]>;
  };
  contacts?: any[];
}

export const AdvancedFiltersModal: React.FC<AdvancedFiltersModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    filters,
    onApplyFilters,
    availableData,
  } = props;
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);
  const [filteredCities, setFilteredCities] = useState<string[]>(availableData.cities);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<string[]>(availableData.neighborhoods);
  const [searchInputs, setSearchInputs] = useState({
    sentiments: '',
    states: '',
    cities: '',
    neighborhoods: '',
    tags: ''
  });

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Filter cities based on selected states
  useEffect(() => {
    if (localFilters.states.length > 0) {
      const stateCities = localFilters.states.flatMap(state => 
        availableData.citiesByState[state] || []
      );
      setFilteredCities(stateCities);
      
      // Clear city selections that are not in the filtered states
      setLocalFilters(prev => ({
        ...prev,
        cities: prev.cities.filter(city => stateCities.includes(city))
      }));
    } else {
      setFilteredCities(availableData.cities);
    }
  }, [localFilters.states, availableData.citiesByState, availableData.cities]);

  // Filter neighborhoods based on selected cities
  useEffect(() => {
    if (localFilters.cities.length > 0) {
      const cityNeighborhoods = localFilters.cities.flatMap(city => 
        availableData.neighborhoodsByCity[city] || []
      );
      setFilteredNeighborhoods(cityNeighborhoods);
      
      // Clear neighborhood selections that are not in the filtered cities
      setLocalFilters(prev => ({
        ...prev,
        neighborhoods: prev.neighborhoods.filter(neighborhood => cityNeighborhoods.includes(neighborhood))
      }));
    } else {
      setFilteredNeighborhoods(availableData.neighborhoods);
    }
  }, [localFilters.cities, availableData.neighborhoodsByCity, availableData.neighborhoods]);

  const handleMultiSelect = (field: keyof AdvancedFilters, value: string) => {
    setLocalFilters(prev => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return { ...prev, [field]: newArray };
    });
  };

  const removeFilter = (field: keyof AdvancedFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter(item => item !== value)
    }));
  };

  const clearAllFilters = () => {
    setLocalFilters({
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
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleExportExcel = () => {
    const { contacts: exportContacts } = props;
    if (!exportContacts || exportContacts.length === 0) {
      alert('Nenhum contato encontrado para exportar');
      return;
    }

    // Prepare data for Excel export
    const excelData = exportContacts.map((contact, index) => ({
      'Linha': index + 1,
      'Nome': contact.name || '',
      'Telefone': contact.phone || '',
      'Email': contact.email || '',
      'Cidade': contact.cidade || '',
      'Bairro': contact.bairro || '',
      'Sentimento': contact.sentimento || '',
      'Evento': contact.evento || '',
      'Tags': Array.isArray(contact.tags) ? contact.tags.map((tag: any) => tag.name).join(', ') : '',
      'Status': contact.status || '',
      'Data de Cadastro': contact.created_at ? new Date(contact.created_at).toLocaleDateString('pt-BR') : '',
      'Observações': contact.notes || ''
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 8 },   // Linha
      { wch: 25 },  // Nome
      { wch: 15 },  // Telefone
      { wch: 30 },  // Email
      { wch: 20 },  // Cidade
      { wch: 20 },  // Bairro
      { wch: 15 },  // Sentimento
      { wch: 25 },  // Evento
      { wch: 30 },  // Tags
      { wch: 12 },  // Status
      { wch: 12 },  // Data
      { wch: 40 }   // Observações
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Contatos Filtrados');

    // Generate filename with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `contatos-filtrados-${dateStr}-${timeStr}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  const activeFiltersCount = Object.values(localFilters).flat().filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} filtros ativos</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="searchTerm">Busca Geral</Label>
            <div className="flex gap-2">
              <Input
                id="searchTerm"
                placeholder="Buscar por nome, telefone, email..."
                value={localFilters.searchTerm}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="flex-1"
              />
              <Select
                value={localFilters.searchOperator}
                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, searchOperator: value as 'AND' | 'OR' }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">E</SelectItem>
                  <SelectItem value="OR">OU</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sentiments */}
          <div className="space-y-2">
            <Label>Sentimentos</Label>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar sentimentos..."
                value={searchInputs.sentiments}
                onChange={(e) => setSearchInputs(prev => ({ ...prev, sentiments: e.target.value }))}
                className="pl-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {['Negativo', 'Neutro', 'Positivo', 'Super Engajado']
                .filter(sentiment => 
                  sentiment.toLowerCase().includes(searchInputs.sentiments.toLowerCase())
                )
                .map((sentiment) => (
                <div key={sentiment} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sentiment-${sentiment}`}
                    checked={localFilters.sentiments.includes(sentiment)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleMultiSelect('sentiments', sentiment);
                      } else {
                        removeFilter('sentiments', sentiment);
                      }
                    }}
                  />
                  <Label htmlFor={`sentiment-${sentiment}`} className="text-sm">
                    {sentiment}
                  </Label>
                </div>
              ))}
            </div>
            {localFilters.sentiments.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {localFilters.sentiments.map((sentiment) => (
                  <Badge key={sentiment} variant="secondary" className="text-xs">
                    {sentiment}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('sentiments', sentiment)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Geographic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* States */}
            <div className="space-y-2">
              <Label>Estados</Label>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar estados..."
                  value={searchInputs.states}
                  onChange={(e) => setSearchInputs(prev => ({ ...prev, states: e.target.value }))}
                  className="pl-8"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                {availableData.states.length > 0 ? (
                  <>
                    {BRAZILIAN_STATES
                      .filter(state => 
                        availableData.states.includes(state.code) &&
                        state.name.toLowerCase().includes(searchInputs.states.toLowerCase())
                      )
                      .map((state) => (
                      <div key={state.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`state-${state.code}`}
                          checked={localFilters.states.includes(state.code)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleMultiSelect('states', state.code);
                            } else {
                              removeFilter('states', state.code);
                            }
                          }}
                        />
                        <Label htmlFor={`state-${state.code}`} className="text-sm">
                          {state.name}
                        </Label>
                      </div>
                    ))}
                    {availableData.states.includes('OUTROS') && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="state-OUTROS"
                          checked={localFilters.states.includes('OUTROS')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleMultiSelect('states', 'OUTROS');
                            } else {
                              removeFilter('states', 'OUTROS');
                            }
                          }}
                        />
                        <Label htmlFor="state-OUTROS" className="text-sm">
                          Outros
                        </Label>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum estado disponível</p>
                )}
              </div>
              {localFilters.states.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.states.map((stateCode) => {
                    const state = BRAZILIAN_STATES.find(s => s.code === stateCode);
                    return (
                      <Badge key={stateCode} variant="secondary" className="text-xs">
                        {state?.name}
                        <X 
                          className="ml-1 h-3 w-3 cursor-pointer" 
                          onClick={() => removeFilter('states', stateCode)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cities */}
            <div className="space-y-2">
              <Label>Cidades</Label>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cidades..."
                  value={searchInputs.cities}
                  onChange={(e) => setSearchInputs(prev => ({ ...prev, cities: e.target.value }))}
                  className="pl-8"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                {filteredCities
                  .filter(city => 
                    city.toLowerCase().includes(searchInputs.cities.toLowerCase())
                  )
                  .map((city) => (
                  <div key={city} className="flex items-center space-x-2">
                    <Checkbox
                      id={`city-${city}`}
                      checked={localFilters.cities.includes(city)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleMultiSelect('cities', city);
                        } else {
                          removeFilter('cities', city);
                        }
                      }}
                    />
                    <Label htmlFor={`city-${city}`} className="text-sm">
                      {city}
                    </Label>
                  </div>
                ))}
              </div>
              {localFilters.cities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.cities.map((city) => (
                    <Badge key={city} variant="secondary" className="text-xs">
                      {city}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => removeFilter('cities', city)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Neighborhoods */}
            <div className="space-y-2">
              <Label>Bairros</Label>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar bairros..."
                  value={searchInputs.neighborhoods}
                  onChange={(e) => setSearchInputs(prev => ({ ...prev, neighborhoods: e.target.value }))}
                  className="pl-8"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                {filteredNeighborhoods
                  .filter(neighborhood => 
                    neighborhood.toLowerCase().includes(searchInputs.neighborhoods.toLowerCase())
                  )
                  .map((neighborhood) => (
                  <div key={neighborhood} className="flex items-center space-x-2">
                    <Checkbox
                      id={`neighborhood-${neighborhood}`}
                      checked={localFilters.neighborhoods.includes(neighborhood)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleMultiSelect('neighborhoods', neighborhood);
                        } else {
                          removeFilter('neighborhoods', neighborhood);
                        }
                      }}
                    />
                    <Label htmlFor={`neighborhood-${neighborhood}`} className="text-sm">
                      {neighborhood}
                    </Label>
                  </div>
                ))}
              </div>
              {localFilters.neighborhoods.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.neighborhoods.map((neighborhood) => (
                    <Badge key={neighborhood} variant="secondary" className="text-xs">
                      {neighborhood}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => removeFilter('neighborhoods', neighborhood)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tags..."
                value={searchInputs.tags}
                onChange={(e) => setSearchInputs(prev => ({ ...prev, tags: e.target.value }))}
                className="pl-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {availableData.tags
                .filter(tag => 
                  tag.toLowerCase().includes(searchInputs.tags.toLowerCase())
                )
                .map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={localFilters.tags.includes(tag)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleMultiSelect('tags', tag);
                      } else {
                        removeFilter('tags', tag);
                      }
                    }}
                  />
                  <Label htmlFor={`tag-${tag}`} className="text-sm">
                    {tag}
                  </Label>
                </div>
              ))}
            </div>
            {localFilters.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {localFilters.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('tags', tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Data de cadastro - De</Label>
              <Input
                id="dateFrom"
                type="date"
                value={localFilters.dateRange.from}
                onChange={(e) => setLocalFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, from: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Data de cadastro - Até</Label>
              <Input
                id="dateTo"
                type="date"
                value={localFilters.dateRange.to}
                onChange={(e) => setLocalFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, to: e.target.value }
                }))}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-4">
              {['active', 'inactive'].map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={status}
                    checked={localFilters.status.includes(status)}
                    onCheckedChange={() => handleMultiSelect('status', status)}
                  />
                  <Label htmlFor={status} className="text-sm">
                    {status === 'active' ? 'Ativo' : 'Inativo'}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={clearAllFilters}>
            Limpar Todos
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>
            Aplicar Filtros ({activeFiltersCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedFiltersModal;