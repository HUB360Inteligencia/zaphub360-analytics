
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SENTIMENT_OPTIONS, normalizeSentiment } from '@/lib/sentiment';
import { TrendingUp, ThumbsUp, Minus, ThumbsDown, Circle } from 'lucide-react';

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

  const getIcon = (iconName: string) => {
    const icons = { TrendingUp, ThumbsUp, Minus, ThumbsDown, Circle };
    return icons[iconName as keyof typeof icons] || Circle;
  };

  return (
    <Select 
      value={normalizedValue || 'null'} 
      onValueChange={handleValueChange} 
      disabled={disabled}
    >
      {/* Remove a borda/background padrão para deixar apenas o estilo essencial do badge */}
      <SelectTrigger className="w-36 border-0 bg-transparent shadow-none px-0">
        <SelectValue>
          {selectedOption ? (
            <Badge variant="outline" className={selectedOption.color}>
              {(() => {
                const IconComponent = getIcon(selectedOption.icon);
                return <IconComponent className="w-3 h-3 mr-1" />;
              })()}
              {selectedOption.label}
            </Badge>
          ) : (
            <span className="text-muted-foreground">Selecionar</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SENTIMENT_OPTIONS.map((option) => {
          const IconComponent = getIcon(option.icon);
          return (
            <SelectItem key={option.value || 'null'} value={option.value || 'null'}>
              <div className="flex items-center gap-2">
                <IconComponent className="w-4 h-4" />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default SentimentSelect;
