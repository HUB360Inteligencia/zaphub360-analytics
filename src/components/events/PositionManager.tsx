import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useEventPositions } from "@/hooks/useEventPositions";

interface PositionManagerProps {
  value: string[];
  restrictMode: boolean;
  onChange: (positions: string[], restrictMode: boolean) => void;
}

export function PositionManager({ value, restrictMode, onChange }: PositionManagerProps) {
  const [inputValue, setInputValue] = useState("");
  const { positions: historicalPositions } = useEventPositions();

  const addPosition = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed], restrictMode);
      setInputValue("");
    }
  };

  const removePosition = (position: string) => {
    onChange(value.filter(p => p !== position), restrictMode);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPosition();
    }
  };

  // Get suggestions from historical positions that aren't already added
  const suggestions = historicalPositions
    .filter(p => !value.includes(p.cargo))
    .slice(0, 5);

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div>
        <Label className="text-base font-semibold">Cargos Permitidos</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Configure os cargos que estarão disponíveis no check-in deste evento
        </p>
      </div>

      {/* Tags Display */}
      <div className="min-h-[80px] p-3 border border-border rounded-md bg-background">
        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum cargo adicionado. Digite abaixo para adicionar.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.map((position) => (
              <Badge
                key={position}
                variant="secondary"
                className="pl-2.5 pr-1 py-1.5 text-sm font-medium"
              >
                {position}
                <button
                  type="button"
                  onClick={() => removePosition(position)}
                  className="ml-1.5 hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors"
                  aria-label={`Remover ${position}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Input for adding positions */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Digite um cargo e pressione Enter"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={addPosition}
            size="icon"
            variant="secondary"
            disabled={!inputValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Historical suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Sugestões de cargos usados anteriormente:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((pos) => (
                <Badge
                  key={pos.cargo}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary transition-colors"
                  onClick={() => {
                    if (!value.includes(pos.cargo)) {
                      onChange([...value, pos.cargo], restrictMode);
                    }
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {pos.cargo}
                  <span className="ml-1.5 text-xs text-muted-foreground">({pos.usage_count}x)</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Restrict mode checkbox */}
      <div className="flex items-start space-x-3 pt-2 border-t border-border">
        <Checkbox
          id="restrict-positions"
          checked={restrictMode}
          onCheckedChange={(checked) => onChange(value, checked as boolean)}
        />
        <div className="space-y-1">
          <Label
            htmlFor="restrict-positions"
            className="text-sm font-medium cursor-pointer"
          >
            Restringir apenas a estes cargos
          </Label>
          <p className="text-xs text-muted-foreground">
            {restrictMode ? (
              <span className="text-destructive font-medium">
                🔒 Modo restrito ativo: apenas os cargos acima serão aceitos no check-in
              </span>
            ) : (
              <span>
                🔓 Modo flexível: permite criar novos cargos durante o check-in
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
