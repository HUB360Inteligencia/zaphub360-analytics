
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SENTIMENT_OPTIONS, normalizeSentiment } from '@/lib/sentiment';

interface SentimentSelectProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
}

const SentimentSelect = ({ value, onValueChange, disabled }: SentimentSelectProps) => {
  const normalizedValue = normalizeSentiment(value);
  const selectedOption = SENTIMENT_OPTIONS.find(option => option.value === normalizedValue);

  const handleValueChange = (newValue: string) => {
    // Se o valor for 'null', converter para null real
    onValueChange(newValue === 'null' ? null : newValue);
  };

  return (
    <Select 
      value={normalizedValue || 'null'} 
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
        {SENTIMENT_OPTIONS.map((option) => (
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
