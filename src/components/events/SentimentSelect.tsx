
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface SentimentSelectProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
}

const sentimentOptions = [
  { value: null, label: 'Sem classificação', emoji: '⚪', color: 'bg-gray-100 text-gray-600' },
  { value: 'super_engajado', label: 'Super Engajado', emoji: '🔥', color: 'bg-orange-100 text-orange-800' },
  { value: 'positivo', label: 'Positivo', emoji: '😊', color: 'bg-green-100 text-green-800' },
  { value: 'neutro', label: 'Neutro', emoji: '😐', color: 'bg-gray-100 text-gray-800' },
  { value: 'negativo', label: 'Negativo', emoji: '😞', color: 'bg-red-100 text-red-800' },
];

const SentimentSelect = ({ value, onValueChange, disabled }: SentimentSelectProps) => {
  const selectedOption = sentimentOptions.find(option => option.value === value);

  const handleValueChange = (newValue: string) => {
    // Se o valor for 'null', converter para null real
    onValueChange(newValue === 'null' ? null : newValue);
  };

  return (
    <Select 
      value={value || 'null'} 
      onValueChange={handleValueChange} 
      disabled={disabled}
    >
      <SelectTrigger className="w-36">
        <SelectValue>
          {selectedOption ? (
            <Badge variant="outline" className={selectedOption.color}>
              <span className="mr-1">{selectedOption.emoji}</span>
              {selectedOption.label}
            </Badge>
          ) : (
            <span className="text-muted-foreground">Selecionar</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {sentimentOptions.map((option) => (
          <SelectItem key={option.value || 'null'} value={option.value || 'null'}>
            <div className="flex items-center gap-2">
              <span>{option.emoji}</span>
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SentimentSelect;
