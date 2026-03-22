import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

export type FilterComboboxOption = {
  value: string;
  label: string;
  color?: string;
};

export interface FilterComboboxProps {
  label: string;
  options: FilterComboboxOption[];
  selected: string[];
  /** Seleção simples (cidade, bairro, etc.) */
  onSelectedChange: (values: string[]) => void;
  /** Valores excluídos + callback único para incluir/excluir sem corrida de estado */
  selectedExclude?: string[];
  onPairChange?: (include: string[], exclude: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  contentClassName?: string;
}

/**
 * Botão + popover com busca (Command) e seleção múltipla.
 * Opcionalmente suporta modo Incluir/Excluir (sentimento, gênero, evento, campanha, tag).
 */
export const FilterCombobox: React.FC<FilterComboboxProps> = ({
  label,
  options,
  selected,
  onSelectedChange,
  selectedExclude,
  onPairChange,
  loading = false,
  disabled = false,
  emptyMessage = 'Nenhum resultado.',
  contentClassName,
}) => {
  const [open, setOpen] = useState(false);
  const supportsExclude = Boolean(onPairChange);
  const [excludeMode, setExcludeMode] = useState(false);

  const includeCount = selected.length;
  const excludeCount = supportsExclude ? selectedExclude?.length ?? 0 : 0;
  const totalCount = includeCount + excludeCount;

  const activeValues = useMemo(() => {
    if (!supportsExclude) return selected;
    return excludeMode ? selectedExclude ?? [] : selected;
  }, [supportsExclude, excludeMode, selected, selectedExclude]);

  const toggleValue = (value: string) => {
    const set = new Set(activeValues);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    const next = Array.from(set);

    if (!supportsExclude || !onPairChange) {
      onSelectedChange(next);
      return;
    }

    if (excludeMode) {
      const newExclude = next;
      const newInclude = selected.filter((s) => !newExclude.includes(s));
      onPairChange(newInclude, newExclude);
    } else {
      const newInclude = next;
      const newExclude = (selectedExclude ?? []).filter((s) => !newInclude.includes(s));
      onPairChange(newInclude, newExclude);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            'h-9 justify-between gap-1 px-3 font-normal',
            totalCount > 0 && 'border-primary/60 bg-primary/5'
          )}
        >
          <span className="truncate">
            {loading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                {label}
              </span>
            ) : (
              <>
                {label}
                {totalCount > 0 && (
                  <span className="ml-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
                    {totalCount}
                  </span>
                )}
              </>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-[min(92vw,22rem)] p-0', contentClassName)}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter>
          <CommandInput placeholder={`Buscar em ${label.toLowerCase()}…`} />
          {supportsExclude && (
            <div className="flex gap-1 border-b px-2 py-2">
              <Button
                type="button"
                size="sm"
                variant={!excludeMode ? 'default' : 'outline'}
                className="h-8 flex-1 text-xs"
                onClick={() => setExcludeMode(false)}
              >
                Incluir
              </Button>
              <Button
                type="button"
                size="sm"
                variant={excludeMode ? 'destructive' : 'outline'}
                className="h-8 flex-1 text-xs"
                onClick={() => setExcludeMode(true)}
              >
                Excluir
              </Button>
            </div>
          )}
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isChecked = activeValues.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={`${opt.label} ${opt.value}`}
                    onSelect={() => toggleValue(opt.value)}
                    onPointerDown={(e) => e.preventDefault()}
                    className="cursor-pointer"
                  >
                    <span
                      className={cn(
                        'mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary',
                        isChecked
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    {opt.color ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: opt.color }}
                        />
                        <span>{opt.label}</span>
                      </span>
                    ) : (
                      <span>{opt.label}</span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          {options.length > 0 && (
            <div className="border-t px-2 py-1.5 text-center text-xs text-muted-foreground">
              {activeValues.length} de {options.length} selecionado(s)
              {supportsExclude && (
                <span className="block">
                  Modo: {excludeMode ? 'excluir do público' : 'incluir no público'}
                </span>
              )}
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
