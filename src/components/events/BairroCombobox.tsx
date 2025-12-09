import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useBairros, useDistritos, useSubdistritos } from '@/hooks/useIBGELocations';

interface BairroComboboxProps {
  value: string;
  onChange: (value: string) => void;
  cidade: string;
  organizationId: string;
  municipioId?: number | null;
}

export function BairroCombobox({
  value,
  onChange,
  cidade,
  organizationId,
  municipioId = null,
}: BairroComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Historical data from organization
  const { data: bairrosHistoricos = [], isLoading: isLoadingHistoricos } = useBairros(cidade, organizationId);

  // IBGE official data (distritos and subdistritos)
  const { data: distritos = [], isLoading: isLoadingDistritos } = useDistritos(municipioId, searchInput);
  const { data: subdistritos = [], isLoading: isLoadingSubdistritos } = useSubdistritos(municipioId, searchInput);

  const isLoading = isLoadingHistoricos || isLoadingDistritos || isLoadingSubdistritos;

  // Combine all sources, removing duplicates and prioritizing IBGE
  const combinedBairros = useMemo(() => {
    const allNames = new Set<string>();
    const ibgeItems: string[] = [];
    const historicItems: string[] = [];

    // Add IBGE distritos first (official)
    distritos.forEach((d) => {
      const normalized = d.nome.trim();
      if (normalized && !allNames.has(normalized.toLowerCase())) {
        allNames.add(normalized.toLowerCase());
        ibgeItems.push(normalized);
      }
    });

    // Add IBGE subdistritos (official)
    subdistritos.forEach((s) => {
      const normalized = s.nome.trim();
      if (normalized && !allNames.has(normalized.toLowerCase())) {
        allNames.add(normalized.toLowerCase());
        ibgeItems.push(normalized);
      }
    });

    // Add historical data from organization
    bairrosHistoricos.forEach((b) => {
      const normalized = b.trim();
      if (normalized && !allNames.has(normalized.toLowerCase())) {
        allNames.add(normalized.toLowerCase());
        historicItems.push(normalized);
      }
    });

    return { ibgeItems, historicItems };
  }, [distritos, subdistritos, bairrosHistoricos]);

  // Filter by search input
  const filteredBairros = useMemo(() => {
    const { ibgeItems, historicItems } = combinedBairros;

    if (!searchInput) {
      return { ibge: ibgeItems, historico: historicItems };
    }

    const searchLower = searchInput.toLowerCase();
    return {
      ibge: ibgeItems.filter((b) => b.toLowerCase().includes(searchLower)),
      historico: historicItems.filter((b) => b.toLowerCase().includes(searchLower)),
    };
  }, [combinedBairros, searchInput]);

  const handleSelect = (bairro: string) => {
    onChange(bairro);
    setOpen(false);
  };

  const showCreateOption =
    searchInput.length > 0 &&
    !filteredBairros.ibge.some((b) => b.toLowerCase() === searchInput.toLowerCase()) &&
    !filteredBairros.historico.some((b) => b.toLowerCase() === searchInput.toLowerCase());

  const hasResults = filteredBairros.ibge.length > 0 || filteredBairros.historico.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={!cidade}
        >
          {value || 'Selecione o bairro...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={cidade ? 'Buscar ou criar bairro...' : 'Selecione uma cidade primeiro'}
            value={searchInput}
            onValueChange={setSearchInput}
            disabled={!cidade}
          />
          <CommandList>
            <CommandEmpty>
              {!cidade
                ? 'Selecione uma cidade primeiro'
                : isLoading
                ? 'Carregando bairros...'
                : !hasResults && !showCreateOption
                ? 'Nenhum bairro encontrado'
                : null}
            </CommandEmpty>

            {showCreateOption && (
              <CommandGroup heading="Criar novo">
                <CommandItem
                  value={searchInput}
                  onSelect={() => handleSelect(searchInput)}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  <span className="font-medium">Criar: </span>
                  <span className="ml-1">{searchInput}</span>
                </CommandItem>
              </CommandGroup>
            )}

            {filteredBairros.ibge.length > 0 && (
              <CommandGroup heading="Dados oficiais (IBGE)">
                {filteredBairros.ibge.map((bairro) => (
                  <CommandItem
                    key={`ibge-${bairro}`}
                    value={bairro}
                    onSelect={() => handleSelect(bairro)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === bairro ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {bairro}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredBairros.historico.length > 0 && (
              <CommandGroup heading="Dados históricos">
                {filteredBairros.historico.map((bairro) => (
                  <CommandItem
                    key={`hist-${bairro}`}
                    value={bairro}
                    onSelect={() => handleSelect(bairro)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === bairro ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {bairro}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
