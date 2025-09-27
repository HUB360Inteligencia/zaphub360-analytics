import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export type AdvancedFilters = {
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

interface AdvancedFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onApplyFilters: (filters: AdvancedFilters) => void;
  contacts: any[];
  availableData: {
    sentiments: string[];
    states: string[];
    cities: string[];
    neighborhoods: string[];
    tags: string[];
    citiesByState?: Record<string, string[]>;
    neighborhoodsByCity?: Record<string, string[]>;
  };
}

function AdvancedFiltersModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  availableData
}: AdvancedFiltersModalProps) {
  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Exemplo: campo de busca */}
          <div>
            <Label htmlFor="searchTerm">Buscar</Label>
            <Input
              id="searchTerm"
              placeholder="Digite um termo de busca..."
              defaultValue={filters.searchTerm}
            />
          </div>

          {/* Exemplo: checkbox de sentimentos */}
          <div>
            <Label>Sentimentos</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableData.sentiments.map((s) => (
                <label key={s} className="flex items-center space-x-2">
                  <Checkbox checked={filters.sentiments.includes(s)} />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Exemplo: checkbox de cidades */}
          <div>
            <Label>Cidades</Label>
            <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto">
              {availableData.cities.map((c) => (
                <label key={c} className="flex items-center space-x-2">
                  <Checkbox checked={filters.cities.includes(c)} />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AdvancedFiltersModal;
