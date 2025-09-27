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
import { X, Plus, Search } from 'lucide-react';
import { BRAZILIAN_STATES, NORMALIZED_SENTIMENTS } from '@/lib/brazilianStates';

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
    cities: string[];
    neighborhoods: string[];
    tags: string[];
  };
}

export const AdvancedFiltersModal: React.FC<AdvancedFiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  availableData,
}) => {
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<string[]>([]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    // Filter cities based on selected states (simulated - in real app would be from database)
    if (localFilters.states.length === 0) {
      setFilteredCities(availableData.cities);
    } else {
      setFilteredCities(availableData.cities);
    }
  }, [localFilters.states, availableData.cities]);

  useEffect(() => {
    // Filter neighborhoods based on selected cities
    if (localFilters.cities.length === 0) {
      setFilteredNeighborhoods(availableData.neighborhoods);
    } else {
      setFilteredNeighborhoods(availableData.neighborhoods);
    }
  }, [localFilters.cities, availableData.neighborhoods]);

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
            <div className="grid grid-cols-2 gap-2">
              {NORMALIZED_SENTIMENTS.map(sentiment => (
                <div key={sentiment} className="flex items-center space-x-2">
                  <Checkbox
                    id={sentiment}
                    checked={localFilters.sentiments.includes(sentiment)}
                    onCheckedChange={() => handleMultiSelect('sentiments', sentiment)}
                  />
                  <Label htmlFor={sentiment} className="text-sm">{sentiment}</Label>
                </div>
              ))}
            </div>
            {localFilters.sentiments.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {localFilters.sentiments.map(sentiment => (
                  <Badge key={sentiment} variant="secondary" className="text-xs">
                    {sentiment}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
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
              <Select onValueChange={(value) => handleMultiSelect('states', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar estados" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map(state => (
                    <SelectItem key={state.code} value={state.name}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {localFilters.states.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {localFilters.states.map(state => (
                    <Badge key={state} variant="outline" className="text-xs">
                      {state}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
                        onClick={() => removeFilter('states', state)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Cities */}
            <div className="space-y-2">
              <Label>Cidades</Label>
              <Select onValueChange={(value) => handleMultiSelect('cities', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cidades" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {localFilters.cities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {localFilters.cities.map(city => (
                    <Badge key={city} variant="outline" className="text-xs">
                      {city}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
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
              <Select onValueChange={(value) => handleMultiSelect('neighborhoods', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar bairros" />
                </SelectTrigger>
                <SelectContent>
                  {filteredNeighborhoods.map(neighborhood => (
                    <SelectItem key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {localFilters.neighborhoods.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {localFilters.neighborhoods.map(neighborhood => (
                    <Badge key={neighborhood} variant="outline" className="text-xs">
                      {neighborhood}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer"
                        onClick={() => removeFilter('neighborhoods', neighborhood)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
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