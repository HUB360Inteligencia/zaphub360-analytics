import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { FilterOptions } from '@/hooks/useAdvancedContactFilter';
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
  };
  events: Event[];
  campaigns: Campaign[];
  tags: Tag[];
  filteredCount: number;
  totalContacts: number;
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
}) => {
  const updateFilter = (key: keyof FilterOptions, values: string[]) => {
    onFiltersChange({ ...filters, [key]: values });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      sentiments: [],
      cidades: [],
      bairros: [],
      includeEvents: [],
      excludeEvents: [],
      includeCampaigns: [],
      excludeCampaigns: [],
      includeTags: [],
      excludeTags: [],
    });
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
        <div className="text-sm text-muted-foreground">
          {filteredCount} de {totalContacts} contatos selecionados
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros por Sentimento */}
        {filterData.sentiments.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Sentimento</Label>
            <div className="grid grid-cols-2 gap-2">
              {filterData.sentiments.map((sentiment) => (
                <div key={sentiment} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`sentiment-${sentiment}`}
                    checked={filters.sentiments.includes(sentiment)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('sentiments', [...filters.sentiments, sentiment]);
                      } else {
                        updateFilter('sentiments', filters.sentiments.filter(s => s !== sentiment));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
                  />
                  <Label 
                    htmlFor={`sentiment-${sentiment}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {sentiment}
                  </Label>
                </div>
              ))}
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