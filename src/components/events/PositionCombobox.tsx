import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useEventPositions } from "@/hooks/useEventPositions";

interface PositionComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function PositionCombobox({ value, onChange }: PositionComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { positions, isLoading } = useEventPositions();

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setSearchValue("");
  };

  const filteredPositions = positions.filter((position) =>
    position.cargo.toLowerCase().includes(searchValue.toLowerCase())
  );

  const showCreateOption = 
    searchValue.trim() !== "" && 
    !filteredPositions.some((p) => p.cargo.toLowerCase() === searchValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Selecione ou digite um cargo..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar ou criar cargo..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Carregando..." : "Nenhum cargo encontrado."}
            </CommandEmpty>
            
            {showCreateOption && (
              <CommandGroup>
                <CommandItem
                  value={searchValue}
                  onSelect={() => handleSelect(searchValue)}
                  className="text-primary"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      "opacity-0"
                    )}
                  />
                  Criar "{searchValue}"
                </CommandItem>
              </CommandGroup>
            )}

            {filteredPositions.length > 0 && (
              <CommandGroup heading="Cargos usados anteriormente">
                {filteredPositions.map((position) => (
                  <CommandItem
                    key={position.cargo}
                    value={position.cargo}
                    onSelect={() => handleSelect(position.cargo)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === position.cargo ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1">{position.cargo}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {position.usage_count}x
                    </Badge>
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
