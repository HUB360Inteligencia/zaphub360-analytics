import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEstados, useCidades } from '@/hooks/useIBGELocations';

interface CityComboboxProps {
  value: string;
  onChange: (value: string) => void;
  stateUF: string;
  onStateChange: (uf: string) => void;
  defaultState?: string;
}

export function CityCombobox({
  value,
  onChange,
  stateUF,
  onStateChange,
  defaultState = 'PR',
}: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: estados = [], isLoading: loadingEstados } = useEstados();
  const { data: cidades = [], isLoading: loadingCidades } = useCidades(stateUF, searchTerm);

  // Set default state on mount
  useEffect(() => {
    if (!stateUF && defaultState) {
      onStateChange(defaultState);
    }
  }, [stateUF, defaultState, onStateChange]);

  const handleSelect = (cidadeNome: string) => {
    onChange(cidadeNome);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select value={stateUF} onValueChange={onStateChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {loadingEstados ? (
              <SelectItem value="loading" disabled>
                Carregando...
              </SelectItem>
            ) : (
              estados.map((estado) => (
                <SelectItem key={estado.id} value={estado.sigla}>
                  {estado.sigla}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
              disabled={!stateUF}
            >
              {value || 'Selecione a cidade...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Digite no mínimo 3 letras..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>
                  {searchTerm.length < 3
                    ? 'Digite pelo menos 3 letras para buscar'
                    : loadingCidades
                    ? 'Buscando cidades...'
                    : 'Nenhuma cidade encontrada'}
                </CommandEmpty>
                {searchTerm.length >= 3 && cidades.length > 0 && (
                  <CommandGroup>
                    {cidades.map((cidade) => (
                      <CommandItem
                        key={cidade.id}
                        value={cidade.nome}
                        onSelect={() => handleSelect(cidade.nome)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === cidade.nome ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {cidade.nome}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
