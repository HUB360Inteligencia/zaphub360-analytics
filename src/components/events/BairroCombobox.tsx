import { useState } from 'react';
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
import { useBairros } from '@/hooks/useIBGELocations';

interface BairroComboboxProps {
  value: string;
  onChange: (value: string) => void;
  cidade: string;
  organizationId: string;
}

export function BairroCombobox({
  value,
  onChange,
  cidade,
  organizationId,
}: BairroComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const { data: bairros = [], isLoading } = useBairros(cidade, organizationId);

  const filteredBairros = bairros.filter((bairro) =>
    bairro.toLowerCase().includes(searchInput.toLowerCase())
  );

  const handleSelect = (bairro: string) => {
    onChange(bairro);
    setOpen(false);
  };

  const showCreateOption = searchInput.length > 0 && 
    !filteredBairros.some(b => b.toLowerCase() === searchInput.toLowerCase());

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
      <PopoverContent className="w-full p-0" align="start">
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
                : 'Nenhum bairro encontrado'}
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

            {filteredBairros.length > 0 && (
              <CommandGroup heading="Bairros da região">
                {filteredBairros.map((bairro) => (
                  <CommandItem
                    key={bairro}
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
