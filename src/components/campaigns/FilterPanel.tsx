import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { FilterOptions } from '@/hooks/useAdvancedContactFilter';
import { getSentimentOption } from '@/lib/sentiment';
import { Event } from '@/hooks/useEvents';
import { Campaign } from '@/hooks/useCampaigns';
import { Tag } from '@/hooks/useTags';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  filterData: {
    sentiments: string[];
    cidades: string[];
    bairros: string[];
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
}

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
}) => {
  const updateFilter = (key: keyof FilterOptions, values: string[]) => {
    onFiltersChange({ ...filters, [key]: values });
  };

  const handleIncludeSentiment = (sentiment: string, checked: boolean) => {
    const newInclude = checked
      ? [...filters.sentiments, sentiment]
      : filters.sentiments.filter(s => s !== sentiment);
    const newExclude = filters.sentimentsExclude.filter(s => s !== sentiment);
    onFiltersChange({ ...filters, sentiments: newInclude, sentimentsExclude: newExclude });
  };

  const handleExcludeSentiment = (sentiment: string, checked: boolean) => {
    const newExclude = checked
      ? [...filters.sentimentsExclude, sentiment]
      : filters.sentimentsExclude.filter(s => s !== sentiment);
    const newInclude = checked
      ? filters.sentiments.filter(s => s !== sentiment)
      : filters.sentiments;
    onFiltersChange({ ...filters, sentiments: newInclude, sentimentsExclude: newExclude });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      sentiments: [],
      sentimentsExclude: [],
      cidades: [],
      bairros: [],
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

  const getGeneroLabel = (genero: string) => {
    switch (genero) {
      case 'F': return 'Feminino';
      case 'M': return 'Masculino';
      default: return genero;
    }
  };

  const handleIncludeGenero = (genero: string, checked: boolean) => {
    const newInclude = checked
      ? [...filters.includeGeneros, genero]
      : filters.includeGeneros.filter(g => g !== genero);
    const newExclude = filters.excludeGeneros.filter(g => g !== genero);
    onFiltersChange({ ...filters, includeGeneros: newInclude, excludeGeneros: newExclude });
  };

  const handleExcludeGenero = (genero: string, checked: boolean) => {
    const newExclude = checked
      ? [...filters.excludeGeneros, genero]
      : filters.excludeGeneros.filter(g => g !== genero);
    const newInclude = checked
      ? filters.includeGeneros.filter(g => g !== genero)
      : filters.includeGeneros;
    onFiltersChange({ ...filters, includeGeneros: newInclude, excludeGeneros: newExclude });
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground"
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
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros por Sentimento */}
        {filterData.sentiments.length > 0 && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium mb-2 block">Incluir Sentimentos</Label>
              <div className="grid grid-cols-2 gap-2">
                {filterData.sentiments.map((sentiment) => {
                  const displayLabel = getSentimentOption(sentiment)?.label || sentiment;
                  const isChecked = filters.sentiments.includes(sentiment);
                  return (
                    <div key={`include-${sentiment}`} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`sentiment-include-${sentiment}`}
                        checked={isChecked}
                        onChange={(e) => handleIncludeSentiment(sentiment, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                      />
                      <Label
                        htmlFor={`sentiment-include-${sentiment}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {displayLabel}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Excluir Sentimentos</Label>
              <div className="grid grid-cols-2 gap-2">
                {filterData.sentiments.map((sentiment) => {
                  const displayLabel = getSentimentOption(sentiment)?.label || sentiment;
                  const isChecked = filters.sentimentsExclude.includes(sentiment);
                  return (
                    <div key={`exclude-${sentiment}`} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`sentiment-exclude-${sentiment}`}
                        checked={isChecked}
                        onChange={(e) => handleExcludeSentiment(sentiment, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                      />
                      <Label
                        htmlFor={`sentiment-exclude-${sentiment}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {displayLabel}
                      </Label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Contatos com os sentimentos selecionados acima serão removidos do público alvo, mesmo que estejam incluídos por outros filtros.
              </p>
            </div>
          </div>
        )}

        {/* Filtros por Gênero */}
        {filterData.generos.length > 0 && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium mb-2 block">Incluir Gênero</Label>
              <div className="grid grid-cols-2 gap-2">
                {filterData.generos.map((genero) => (
                  <div key={`include-genero-${genero}`} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`genero-include-${genero}`}
                      checked={filters.includeGeneros.includes(genero)}
                      onChange={(e) => handleIncludeGenero(genero, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                    />
                    <Label
                      htmlFor={`genero-include-${genero}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {getGeneroLabel(genero)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Excluir Gênero</Label>
              <div className="grid grid-cols-2 gap-2">
                {filterData.generos.map((genero) => (
                  <div key={`exclude-genero-${genero}`} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`genero-exclude-${genero}`}
                      checked={filters.excludeGeneros.includes(genero)}
                      onChange={(e) => handleExcludeGenero(genero, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                    />
                    <Label
                      htmlFor={`genero-exclude-${genero}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {getGeneroLabel(genero)}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Contatos com os gêneros selecionados acima serão removidos do público alvo.
              </p>
            </div>
          </div>
        )}

        {/* Filtros por Cidade */}
        {filterData.cidades.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Cidade</Label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {filterData.cidades.map((cidade) => (
                <div key={cidade} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`cidade-${cidade}`}
                    checked={filters.cidades.includes(cidade)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('cidades', [...filters.cidades, cidade]);
                      } else {
                        updateFilter('cidades', filters.cidades.filter(c => c !== cidade));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                  />
                  <Label 
                    htmlFor={`cidade-${cidade}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {cidade}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros por Bairro */}
        {filterData.bairros.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Bairro</Label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {filterData.bairros.map((bairro) => (
                <div key={bairro} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`bairro-${bairro}`}
                    checked={filters.bairros.includes(bairro)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('bairros', [...filters.bairros, bairro]);
                      } else {
                        updateFilter('bairros', filters.bairros.filter(b => b !== bairro));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                  />
                  <Label 
                    htmlFor={`bairro-${bairro}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {bairro}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros por Perfil do Contato */}
        {filterData.profiles.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Perfil do Contato</Label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {filterData.profiles.map((profile) => (
                <div key={profile} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`profile-${profile}`}
                    checked={filters.profiles.includes(profile)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('profiles', [...filters.profiles, profile]);
                      } else {
                        updateFilter('profiles', filters.profiles.filter(p => p !== profile));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                  />
                  <Label 
                    htmlFor={`profile-${profile}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {profile}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros por Eventos */}
        {events.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Participação em Eventos</Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-green-600 mb-1 block">Incluir quem participou</Label>
                <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`include-event-${event.id}`}
                        checked={filters.includeEvents.includes(event.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('includeEvents', [...filters.includeEvents, event.id]);
                          } else {
                            updateFilter('includeEvents', filters.includeEvents.filter(e => e !== event.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                      />
                      <Label 
                        htmlFor={`include-event-${event.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {event.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-red-600 mb-1 block">Excluir quem participou</Label>
                <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`exclude-event-${event.id}`}
                        checked={filters.excludeEvents.includes(event.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('excludeEvents', [...filters.excludeEvents, event.id]);
                          } else {
                            updateFilter('excludeEvents', filters.excludeEvents.filter(e => e !== event.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                      />
                      <Label 
                        htmlFor={`exclude-event-${event.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {event.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros por Campanhas */}
        {campaigns.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Participação em Campanhas</Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-green-600 mb-1 block">Incluir quem participou</Label>
                <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`include-campaign-${campaign.id}`}
                        checked={filters.includeCampaigns.includes(campaign.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('includeCampaigns', [...filters.includeCampaigns, campaign.id]);
                          } else {
                            updateFilter('includeCampaigns', filters.includeCampaigns.filter(c => c !== campaign.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                      />
                      <Label 
                        htmlFor={`include-campaign-${campaign.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {campaign.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-red-600 mb-1 block">Excluir quem participou</Label>
                <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`exclude-campaign-${campaign.id}`}
                        checked={filters.excludeCampaigns.includes(campaign.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('excludeCampaigns', [...filters.excludeCampaigns, campaign.id]);
                          } else {
                            updateFilter('excludeCampaigns', filters.excludeCampaigns.filter(c => c !== campaign.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                      />
                      <Label 
                        htmlFor={`exclude-campaign-${campaign.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {campaign.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros por Tags */}
        {tags.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Tags</Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-green-600 mb-1 block">Incluir por tag</Label>
                <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`include-tag-${tag.id}`}
                        checked={filters.includeTags.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('includeTags', [...filters.includeTags, tag.id]);
                          } else {
                            updateFilter('includeTags', filters.includeTags.filter(t => t !== tag.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex items-center gap-2">
                        <Badge 
                          style={{ backgroundColor: tag.color }}
                          className="text-white text-xs"
                        >
                          {tag.name}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-red-600 mb-1 block">Excluir por tag</Label>
                <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`exclude-tag-${tag.id}`}
                        checked={filters.excludeTags.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('excludeTags', [...filters.excludeTags, tag.id]);
                          } else {
                            updateFilter('excludeTags', filters.excludeTags.filter(t => t !== tag.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex items-center gap-2">
                        <Badge 
                          style={{ backgroundColor: tag.color }}
                          className="text-white text-xs"
                        >
                          {tag.name}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};