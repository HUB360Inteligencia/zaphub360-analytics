import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { FilterOptions } from '@/hooks/useAdvancedContactFilter';
import { getSentimentOption } from '@/lib/sentiment';
import { Event } from '@/hooks/useEvents';
import { Campaign } from '@/hooks/useCampaigns';
import { Tag } from '@/hooks/useTags';

export interface ActiveFiltersBadgesProps {
  filters: FilterOptions;
  onFiltersChange: (next: FilterOptions) => void;
  events: Event[];
  campaigns: Campaign[];
  tags: Tag[];
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

type BadgeItem = { id: string; label: string; variant?: 'default' | 'destructive' | 'secondary' };

export const ActiveFiltersBadges: React.FC<ActiveFiltersBadgesProps> = ({
  filters,
  onFiltersChange,
  events,
  campaigns,
  tags,
}) => {
  const items = useMemo(() => {
    const out: BadgeItem[] = [];

    filters.sentiments.forEach((v) => {
      const label = getSentimentOption(v)?.label || v;
      out.push({
        id: `sent-inc-${v}`,
        label: `Sentimento: ${label}`,
        variant: 'default',
      });
    });
    filters.sentimentsExclude.forEach((v) => {
      const label = getSentimentOption(v)?.label || v;
      out.push({
        id: `sent-exc-${v}`,
        label: `Excluir sentimento: ${label}`,
        variant: 'destructive',
      });
    });

    filters.includeGeneros.forEach((v) => {
      out.push({
        id: `gen-inc-${v}`,
        label: `Gênero: ${generoLabel(v)}`,
      });
    });
    filters.excludeGeneros.forEach((v) => {
      out.push({
        id: `gen-exc-${v}`,
        label: `Excluir gênero: ${generoLabel(v)}`,
        variant: 'destructive',
      });
    });

    filters.cidades.forEach((v) => {
      out.push({ id: `cid-${v}`, label: `Cidade: ${v}` });
    });
    filters.bairros.forEach((v) => {
      out.push({ id: `bai-${v}`, label: `Bairro: ${v}` });
    });
    filters.regionais.forEach((v) => {
      out.push({ id: `reg-${v}`, label: `Regional: ${v}` });
    });
    filters.profiles.forEach((v) => {
      out.push({ id: `prof-${v}`, label: `Perfil: ${v}` });
    });

    filters.includeEvents.forEach((id) => {
      const ev = events.find((e) => e.id === id);
      out.push({ id: `ev-inc-${id}`, label: `Evento: ${ev?.name || id}` });
    });
    filters.excludeEvents.forEach((id) => {
      const ev = events.find((e) => e.id === id);
      out.push({
        id: `ev-exc-${id}`,
        label: `Excluir evento: ${ev?.name || id}`,
        variant: 'destructive',
      });
    });

    filters.includeCampaigns.forEach((id) => {
      const c = campaigns.find((x) => x.id === id);
      out.push({ id: `camp-inc-${id}`, label: `Campanha: ${c?.name || id}` });
    });
    filters.excludeCampaigns.forEach((id) => {
      const c = campaigns.find((x) => x.id === id);
      out.push({
        id: `camp-exc-${id}`,
        label: `Excluir campanha: ${c?.name || id}`,
        variant: 'destructive',
      });
    });

    filters.includeTags.forEach((id) => {
      const t = tags.find((x) => x.id === id);
      out.push({ id: `tag-inc-${id}`, label: `Tag: ${t?.name || id}` });
    });
    filters.excludeTags.forEach((id) => {
      const t = tags.find((x) => x.id === id);
      out.push({
        id: `tag-exc-${id}`,
        label: `Excluir tag: ${t?.name || id}`,
        variant: 'destructive',
      });
    });

    return out;
  }, [filters, events, campaigns, tags]);

  const remove = (id: string) => {
    if (id.startsWith('sent-inc-')) {
      const v = id.replace('sent-inc-', '');
      onFiltersChange({
        ...filters,
        sentiments: filters.sentiments.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('sent-exc-')) {
      const v = id.replace('sent-exc-', '');
      onFiltersChange({
        ...filters,
        sentimentsExclude: filters.sentimentsExclude.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('gen-inc-')) {
      const v = id.replace('gen-inc-', '');
      onFiltersChange({
        ...filters,
        includeGeneros: filters.includeGeneros.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('gen-exc-')) {
      const v = id.replace('gen-exc-', '');
      onFiltersChange({
        ...filters,
        excludeGeneros: filters.excludeGeneros.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('cid-')) {
      const v = id.slice(4);
      onFiltersChange({
        ...filters,
        cidades: filters.cidades.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('bai-')) {
      const v = id.slice(4);
      onFiltersChange({
        ...filters,
        bairros: filters.bairros.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('reg-')) {
      const v = id.slice(4);
      onFiltersChange({
        ...filters,
        regionais: filters.regionais.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('prof-')) {
      const v = id.slice(5);
      onFiltersChange({
        ...filters,
        profiles: filters.profiles.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('ev-inc-')) {
      const v = id.replace('ev-inc-', '');
      onFiltersChange({
        ...filters,
        includeEvents: filters.includeEvents.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('ev-exc-')) {
      const v = id.replace('ev-exc-', '');
      onFiltersChange({
        ...filters,
        excludeEvents: filters.excludeEvents.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('camp-inc-')) {
      const v = id.replace('camp-inc-', '');
      onFiltersChange({
        ...filters,
        includeCampaigns: filters.includeCampaigns.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('camp-exc-')) {
      const v = id.replace('camp-exc-', '');
      onFiltersChange({
        ...filters,
        excludeCampaigns: filters.excludeCampaigns.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('tag-inc-')) {
      const v = id.replace('tag-inc-', '');
      onFiltersChange({
        ...filters,
        includeTags: filters.includeTags.filter((s) => s !== v),
      });
      return;
    }
    if (id.startsWith('tag-exc-')) {
      const v = id.replace('tag-exc-', '');
      onFiltersChange({
        ...filters,
        excludeTags: filters.excludeTags.filter((s) => s !== v),
      });
    }
  };

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nenhum filtro ativo. Use os botões abaixo para refinar o público.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground shrink-0">Ativos:</span>
      {items.map((item) => (
        <Badge
          key={item.id}
          variant={item.variant === 'destructive' ? 'destructive' : 'secondary'}
          className="gap-1 pr-1 py-1 pl-2 font-normal"
        >
          <span className="max-w-[200px] truncate">{item.label}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 rounded-full p-0 hover:bg-background/80"
            onClick={() => remove(item.id)}
            aria-label={`Remover ${item.label}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
};
