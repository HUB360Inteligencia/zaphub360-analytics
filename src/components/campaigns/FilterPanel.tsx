import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { FilterOptions } from '@/hooks/useAdvancedContactFilter';
import { getSentimentOption } from '@/lib/sentiment';
import { Event } from '@/hooks/useEvents';
import { Campaign } from '@/hooks/useCampaigns';
import { Tag } from '@/hooks/useTags';
import { FilterCombobox } from './FilterCombobox';
import { ActiveFiltersBadges } from './ActiveFiltersBadges';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  filterData: {
    sentiments: string[];
    cidades: string[];
    bairros: string[];
    regionais: string[];
    profiles: string[];
    generos: string[];
  };
  events: Event[];
  campaigns: Campaign[];
  tags: Tag[];
  filteredCount: number;
  totalContacts: number;
  selectedInFilter: number;
  totalSelected: number;
  regionalsOptionsLoading?: boolean;
}

const generoLabel = (g: string) => {
  switch (g) {
    case 'F':
      return 'Feminino';
    case 'M':
      return 'Masculino';
    default:
      return g;
  }
};

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  filterData,
  events,
  campaigns,
  tags,
  filteredCount,
  totalContacts,
  selectedInFilter,
  totalSelected,
  regionalsOptionsLoading = false,
}) => {
  const clearAllFilters = () => {
    onFiltersChange({
      sentiments: [],
      sentimentsExclude: [],
      cidades: [],
      bairros: [],
      regionais: [],
      profiles: [],
      includeEvents: [],
      excludeEvents: [],
      includeCampaigns: [],
      excludeCampaigns: [],
      includeTags: [],
      excludeTags: [],
      includeGeneros: [],
      excludeGeneros: [],
    });
  };

  const hasActiveFilters = Object.values(filters).some((arr) => arr.length > 0);

  const sentimentOptions = filterData.sentiments.map((s) => ({
    value: s,
    label: getSentimentOption(s)?.label || s,
  }));

  const generoOptions = filterData.generos.map((g) => ({
    value: g,
    label: generoLabel(g),
  }));

  const cidadeOptions = filterData.cidades.map((c) => ({ value: c, label: c }));
  const bairroOptions = filterData.bairros.map((b) => ({ value: b, label: b }));
  const regionalOptions = filterData.regionais.map((r) => ({ value: r, label: r }));
  const profileOptions = filterData.profiles.map((p) => ({ value: p, label: p }));

  const eventOptions = events.map((e) => ({ value: e.id, label: e.name }));
  const campaignOptions = campaigns.map((c) => ({ value: c.id, label: c.name }));
  const tagOptions = tags.map((t) => ({
    value: t.id,
    label: t.name,
    color: t.color,
  }));

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-5 w-5 shrink-0" />
            Filtros Avançados
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground shrink-0"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>
            {filteredCount} de {totalContacts} contatos encontrados
          </div>
          {totalSelected > 0 && (
            <div className="text-xs">
              {selectedInFilter} selecionados neste filtro • {totalSelected} selecionados no total
            </div>
          )}
        </div>
        <div className="pt-2 border-t border-border/60">
          <ActiveFiltersBadges
            filters={filters}
            onFiltersChange={onFiltersChange}
            events={events}
            campaigns={campaigns}
            tags={tags}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Clique em um filtro para buscar e marcar opções. Use <strong>Incluir</strong> ou{' '}
          <strong>Excluir</strong> onde disponível.
        </p>
        <div className="flex flex-wrap gap-2">
          <FilterCombobox
            label="Sentimento"
            options={sentimentOptions}
            selected={filters.sentiments}
            onSelectedChange={() => {}}
            selectedExclude={filters.sentimentsExclude}
            onPairChange={(include, exclude) =>
              onFiltersChange({
                ...filters,
                sentiments: include,
                sentimentsExclude: exclude,
              })
            }
            emptyMessage="Nenhum sentimento nos dados desta organização."
          />

          <FilterCombobox
            label="Gênero"
            options={generoOptions}
            selected={filters.includeGeneros}
            onSelectedChange={() => {}}
            selectedExclude={filters.excludeGeneros}
            onPairChange={(include, exclude) =>
              onFiltersChange({
                ...filters,
                includeGeneros: include,
                excludeGeneros: exclude,
              })
            }
            emptyMessage="Nenhum gênero cadastrado nos contatos."
          />

          <FilterCombobox
            label="Cidade"
            options={cidadeOptions}
            selected={filters.cidades}
            onSelectedChange={(cidades) => onFiltersChange({ ...filters, cidades })}
            emptyMessage="Nenhuma cidade nos dados."
          />

          <FilterCombobox
            label="Bairro"
            options={bairroOptions}
            selected={filters.bairros}
            onSelectedChange={(bairros) => onFiltersChange({ ...filters, bairros })}
            emptyMessage="Nenhum bairro nos dados."
          />

          <FilterCombobox
            label="Regional"
            options={regionalOptions}
            selected={filters.regionais}
            onSelectedChange={(regionais) => onFiltersChange({ ...filters, regionais })}
            loading={regionalsOptionsLoading}
            emptyMessage="Nenhuma regional encontrada."
          />

          <FilterCombobox
            label="Perfil"
            options={profileOptions}
            selected={filters.profiles}
            onSelectedChange={(profiles) => onFiltersChange({ ...filters, profiles })}
            emptyMessage="Nenhum perfil nos dados."
          />

          <FilterCombobox
            label="Evento"
            options={eventOptions}
            selected={filters.includeEvents}
            onSelectedChange={() => {}}
            selectedExclude={filters.excludeEvents}
            onPairChange={(include, exclude) =>
              onFiltersChange({
                ...filters,
                includeEvents: include,
                excludeEvents: exclude,
              })
            }
            emptyMessage="Nenhum evento disponível."
          />

          <FilterCombobox
            label="Campanha"
            options={campaignOptions}
            selected={filters.includeCampaigns}
            onSelectedChange={() => {}}
            selectedExclude={filters.excludeCampaigns}
            onPairChange={(include, exclude) =>
              onFiltersChange({
                ...filters,
                includeCampaigns: include,
                excludeCampaigns: exclude,
              })
            }
            emptyMessage="Nenhuma campanha disponível."
          />

          <FilterCombobox
            label="Tag"
            options={tagOptions}
            selected={filters.includeTags}
            onSelectedChange={() => {}}
            selectedExclude={filters.excludeTags}
            onPairChange={(include, exclude) =>
              onFiltersChange({
                ...filters,
                includeTags: include,
                excludeTags: exclude,
              })
            }
            emptyMessage="Nenhuma tag disponível."
          />
        </div>
      </CardContent>
    </Card>
  );
};
