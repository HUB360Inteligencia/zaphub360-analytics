import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface StatusSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: 'fila', label: 'Fila', color: 'text-muted-foreground' as const, variant: 'outline' as const },
  { value: 'pendente', label: 'Pendente', color: 'text-muted-foreground' as const, variant: 'outline' as const },
  { value: 'processando', label: 'Processando', color: 'text-muted-foreground' as const, variant: 'outline' as const },
  { value: 'enviado', label: 'Enviado', color: 'bg-blue-100 text-blue-800' as const, variant: 'secondary' as const },
  { value: 'lido', label: 'Lido', color: 'bg-purple-100 text-purple-800' as const, variant: 'default' as const },
  { value: 'respondido', label: 'Respondido', color: 'bg-emerald-100 text-emerald-800' as const, variant: 'default' as const },
  { value: 'erro', label: 'Erro', color: 'bg-red-100 text-red-800' as const, variant: 'destructive' as const },
];

const StatusSelect = ({ value, onValueChange, disabled, className }: StatusSelectProps) => {
  const selectedOption = STATUS_OPTIONS.find(o => o.value === value) || STATUS_OPTIONS[1];

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      {/* Remove borda/background padrão do Trigger sem afetar acessibilidade */}
      <SelectTrigger className={(className || 'w-32') + ' border-0 bg-transparent shadow-none px-0'}>
        <SelectValue>
          {selectedOption ? (
            <Badge variant={selectedOption.variant} className={selectedOption.color}>
              {selectedOption.label}
            </Badge>
          ) : (
            <span className="text-muted-foreground">Selecionar</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusSelect;