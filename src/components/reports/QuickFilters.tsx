import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface ReportFilters {
  campaigns: string[];
  tags: string[];
  statuses: string[];
  sentiments: string[];
  cidades: string[];
  perfis: string[];
  dataInicio?: Date;
  dataFim?: Date;
}

interface QuickFiltersProps {
  activeFilters: ReportFilters;
  onRemoveFilter: (type: keyof ReportFilters, value: string) => void;
  onClearAll: () => void;
}

export const QuickFilters = ({ activeFilters, onRemoveFilter, onClearAll }: QuickFiltersProps) => {
  const hasFilters = Object.entries(activeFilters).some(([key, value]) => {
    if (key === 'dataInicio' || key === 'dataFim') return !!value;
    return Array.isArray(value) && value.length > 0;
  });
  
  if (!hasFilters) return null;
  
  const getSentimentLabel = (sentiment: string) => {
    const labels: Record<string, string> = {
      'super_engajado': 'Super Engajado',
      'positivo': 'Positivo',
      'neutro': 'Neutro',
      'negativo': 'Negativo',
    };
    return labels[sentiment] || sentiment;
  };
  
  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">Filtros Ativos</p>
        <Button 
          onClick={onClearAll}
          variant="ghost"
          size="sm"
          className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          Limpar todos
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeFilters.campaigns?.map(campaign => (
          <Badge key={campaign} variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
            📢 {campaign}
            <X 
              className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors" 
              onClick={() => onRemoveFilter('campaigns', campaign)}
            />
          </Badge>
        ))}
        {activeFilters.tags?.map(tag => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
            🏷️ {tag}
            <X 
              className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors" 
              onClick={() => onRemoveFilter('tags', tag)}
            />
          </Badge>
        ))}
        {activeFilters.statuses?.map(status => (
          <Badge key={status} variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
            🔵 {status}
            <X 
              className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors" 
              onClick={() => onRemoveFilter('statuses', status)}
            />
          </Badge>
        ))}
        {activeFilters.sentiments?.map(sentiment => (
          <Badge key={sentiment} variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
            {sentiment === 'super_engajado' && '🔥'}
            {sentiment === 'positivo' && '😊'}
            {sentiment === 'neutro' && '😐'}
            {sentiment === 'negativo' && '😞'}
            {' '}
            {getSentimentLabel(sentiment)}
            <X 
              className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors" 
              onClick={() => onRemoveFilter('sentiments', sentiment)}
            />
          </Badge>
        ))}
        {activeFilters.cidades?.map(cidade => (
          <Badge key={cidade} variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
            📍 {cidade}
            <X 
              className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors" 
              onClick={() => onRemoveFilter('cidades', cidade)}
            />
          </Badge>
        ))}
        {activeFilters.perfis?.map(perfil => (
          <Badge key={perfil} variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
            👤 {perfil}
            <X 
              className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors" 
              onClick={() => onRemoveFilter('perfis', perfil)}
            />
          </Badge>
        ))}
      </div>
    </div>
  );
};

