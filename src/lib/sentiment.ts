export const SENTIMENT_VALUES = {
  SUPER_ENGAJADO: 'super engajado',
  POSITIVO: 'positivo', 
  NEUTRO: 'neutro',
  NEGATIVO: 'negativo'
} as const;

export const SENTIMENT_OPTIONS = [
  { 
    value: null, 
    label: 'Sem classificação', 
    icon: 'Circle', 
    color: 'bg-gray-100 text-gray-600',
    gradientColor: 'linear-gradient(135deg, #9ca3af 0%, #d1d5db 100%)'
  },
  { 
    value: SENTIMENT_VALUES.SUPER_ENGAJADO, 
    label: 'Super Engajado', 
    icon: 'TrendingUp', 
    color: 'bg-orange-100 text-orange-800',
    gradientColor: 'linear-gradient(135deg, #ff6b35 0%, #ff8f42 100%)'
  },
  { 
    value: SENTIMENT_VALUES.POSITIVO, 
    label: 'Positivo', 
    icon: 'ThumbsUp', 
    color: 'bg-green-100 text-green-800',
    gradientColor: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
  },
  { 
    value: SENTIMENT_VALUES.NEUTRO, 
    label: 'Neutro', 
    icon: 'Minus', 
    color: 'bg-gray-100 text-gray-800',
    gradientColor: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
  },
  { 
    value: SENTIMENT_VALUES.NEGATIVO, 
    label: 'Negativo', 
    icon: 'ThumbsDown', 
    color: 'bg-red-100 text-red-800',
    gradientColor: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
  },
];

export const normalizeSentiment = (sentiment: string | null): string | null => {
  if (!sentiment) return null;
  
  const normalized = sentiment.toLowerCase().trim();
  
  switch (normalized) {
    case 'super engajado':
    case 'super_engajado':
    case 'superengajado':
      return SENTIMENT_VALUES.SUPER_ENGAJADO;
    case 'positivo':
      return SENTIMENT_VALUES.POSITIVO;
    case 'neutro':
      return SENTIMENT_VALUES.NEUTRO;
    case 'negativo':
      return SENTIMENT_VALUES.NEGATIVO;
    default:
      // Return the normalized sentiment value if it matches our constants
      if (Object.values(SENTIMENT_VALUES).includes(normalized as any)) {
        return normalized;
      }
      return sentiment;
  }
};

export const getSentimentOption = (sentiment: string | null) => {
  const normalizedSentiment = normalizeSentiment(sentiment);
  return SENTIMENT_OPTIONS.find(option => option.value === normalizedSentiment);
};