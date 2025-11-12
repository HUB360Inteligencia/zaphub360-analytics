import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export interface ReportFilters {
  campaigns: string[];
  tags: string[];
  statuses: string[];
  sentiments: string[];
  cidades: string[];
  perfis: string[];
}

interface ReportFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ReportFilters;
  onApplyFilters: (filters: ReportFilters) => void;
  campaigns?: { id: string; name: string }[];
  tags?: { id: string; name: string }[];
  cidades?: string[];
  perfis?: string[];
}

const ReportFiltersModal = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  campaigns = [],
  tags = [],
  cidades = [],
  perfis = [],
}: ReportFiltersModalProps) => {
  const [localFilters, setLocalFilters] = useState<ReportFilters>(filters);

  const statuses = [
    { value: 'enviado', label: 'Enviado' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'lido', label: 'Lido' },
    { value: 'erro', label: 'Erro' },
  ];

  const sentiments = [
    { value: 'super_engajado', label: 'Super Engajado' },
    { value: 'positivo', label: 'Positivo' },
    { value: 'neutro', label: 'Neutro' },
    { value: 'negativo', label: 'Negativo' },
  ];

  const addItem = (field: keyof ReportFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: [...prev[field], value],
    }));
  };

  const removeItem = (field: keyof ReportFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value),
    }));
  };

  const clearAll = () => {
    setLocalFilters({
      campaigns: [],
      tags: [],
      statuses: [],
      sentiments: [],
      cidades: [],
      perfis: [],
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const activeFiltersCount =
    localFilters.campaigns.length +
    localFilters.tags.length +
    localFilters.statuses.length +
    localFilters.sentiments.length +
    localFilters.cidades.length +
    localFilters.perfis.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
          <DialogDescription>
            Filtre os dados do relatório por campanhas, tags, status, sentimento, cidades e perfis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campanhas */}
          <div className="space-y-2">
            <Label>Campanhas</Label>
            <Select
              onValueChange={(value) => {
                if (!localFilters.campaigns.includes(value)) {
                  addItem('campaigns', value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione campanhas" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localFilters.campaigns.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {localFilters.campaigns.map((campaignId) => {
                  const campaign = campaigns.find((c) => c.id === campaignId);
                  return (
                    <Badge key={campaignId} variant="secondary" className="gap-1">
                      {campaign?.name}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeItem('campaigns', campaignId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <Select
              onValueChange={(value) => {
                if (!localFilters.tags.includes(value)) {
                  addItem('tags', value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione tags" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localFilters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {localFilters.tags.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId);
                  return (
                    <Badge key={tagId} variant="secondary" className="gap-1">
                      {tag?.name}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeItem('tags', tagId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status de Envio</Label>
            <Select
              onValueChange={(value) => {
                if (!localFilters.statuses.includes(value)) {
                  addItem('statuses', value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localFilters.statuses.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {localFilters.statuses.map((statusValue) => {
                  const status = statuses.find((s) => s.value === statusValue);
                  return (
                    <Badge key={statusValue} variant="secondary" className="gap-1">
                      {status?.label}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeItem('statuses', statusValue)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sentimento */}
          <div className="space-y-2">
            <Label>Sentimento</Label>
            <Select
              onValueChange={(value) => {
                if (!localFilters.sentiments.includes(value)) {
                  addItem('sentiments', value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione sentimento" />
              </SelectTrigger>
              <SelectContent>
                {sentiments.map((sentiment) => (
                  <SelectItem key={sentiment.value} value={sentiment.value}>
                    {sentiment.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localFilters.sentiments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {localFilters.sentiments.map((sentimentValue) => {
                  const sentiment = sentiments.find((s) => s.value === sentimentValue);
                  return (
                    <Badge key={sentimentValue} variant="secondary" className="gap-1">
                      {sentiment?.label}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeItem('sentiments', sentimentValue)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cidades */}
          <div className="space-y-2">
            <Label>Cidades</Label>
            <Select
              onValueChange={(value) => {
                if (!localFilters.cidades.includes(value)) {
                  addItem('cidades', value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione cidades" />
              </SelectTrigger>
              <SelectContent>
                {cidades.map((cidade) => (
                  <SelectItem key={cidade} value={cidade}>
                    {cidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localFilters.cidades.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {localFilters.cidades.map((cidade) => (
                  <Badge key={cidade} variant="secondary" className="gap-1">
                    📍 {cidade}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeItem('cidades', cidade)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Perfis */}
          <div className="space-y-2">
            <Label>Perfis de Contato</Label>
            <Select
              onValueChange={(value) => {
                if (!localFilters.perfis.includes(value)) {
                  addItem('perfis', value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione perfis" />
              </SelectTrigger>
              <SelectContent>
                {perfis.map((perfil) => (
                  <SelectItem key={perfil} value={perfil}>
                    {perfil}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localFilters.perfis.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {localFilters.perfis.map((perfil) => (
                  <Badge key={perfil} variant="secondary" className="gap-1">
                    👤 {perfil}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeItem('perfis', perfil)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={clearAll}>
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

export default ReportFiltersModal;

