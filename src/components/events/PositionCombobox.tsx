import { useState } from "react";
import { Check, ChevronsUpDown, Lock } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PositionComboboxProps {
  value: string;
  onChange: (value: string) => void;
  eventId?: string;
}

export function PositionCombobox({ value, onChange, eventId }: PositionComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { positions: historicalPositions, isLoading } = useEventPositions();

  // Fetch event configuration if eventId is provided
  const { data: eventConfig } = useQuery({
    queryKey: ['event-positions-config', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select('allowed_positions, restrict_positions')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      return data as { allowed_positions: string[] | null; restrict_positions: boolean | null };
    },
    enabled: !!eventId,
  });

  // Determine the source of positions
  const allowedPositions = eventConfig?.allowed_positions || [];
  const restrictPositions = eventConfig?.restrict_positions || false;

  // Use event-specific positions if configured, otherwise use historical
  const positionsSource = allowedPositions.length > 0
    ? allowedPositions
    : historicalPositions.map(p => p.cargo);

  // Check if we allow creating new positions
  const allowCreateNew = eventId ? !restrictPositions : true;

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setSearchValue("");
  };

  const filteredPositions = positionsSource.filter((position) =>
    position.toLowerCase().includes(searchValue.toLowerCase())
  );

  const showCreateOption = 
    allowCreateNew &&
    searchValue.trim() !== "" && 
    !filteredPositions.some((p) => p.toLowerCase() === searchValue.toLowerCase());

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
              {isLoading ? "Carregando..." : 
               restrictPositions 
                 ? "Nenhum cargo encontrado na lista permitida para este evento." 
                 : "Nenhum cargo encontrado."}
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
              <CommandGroup heading={
                allowedPositions.length > 0 
                  ? restrictPositions 
                    ? "Cargos permitidos para este evento (somente estes)" 
                    : "Cargos sugeridos para este evento"
                  : "Cargos usados anteriormente"
              }>
                {filteredPositions.map((position) => {
                  // Find usage count from historical data if available
                  const historicalData = historicalPositions.find(p => p.cargo === position);
                  const usageCount = historicalData?.usage_count;
                  
                  return (
                    <CommandItem
                      key={position}
                      value={position}
                      onSelect={() => handleSelect(position)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === position ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1">{position}</span>
                      {restrictPositions && allowedPositions.includes(position) && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Oficial
                        </Badge>
                      )}
                      {usageCount && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {usageCount}x
                        </Badge>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
