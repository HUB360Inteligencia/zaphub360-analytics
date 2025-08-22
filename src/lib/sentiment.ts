export const SENTIMENT_VALUES = {
  SUPER_ENGAJADO: 'super engajado',
  POSITIVO: 'positivo', 
  NEUTRO: 'neutro',
  NEGATIVO: 'negativo'
} as const;

export const SENTIMENT_OPTIONS = [
  { value: null, label: 'Sem classificação', emoji: '⚪', color: 'bg-gray-100 text-gray-600' },
  { value: SENTIMENT_VALUES.SUPER_ENGAJADO, label: 'Super Engajado', emoji: '🔥', color: 'bg-orange-100 text-orange-800' },
  { value: SENTIMENT_VALUES.POSITIVO, label: 'Positivo', emoji: '😊', color: 'bg-green-100 text-green-800' },
  { value: SENTIMENT_VALUES.NEUTRO, label: 'Neutro', emoji: '😐', color: 'bg-gray-100 text-gray-800' },
  { value: SENTIMENT_VALUES.NEGATIVO, label: 'Negativo', emoji: '😞', color: 'bg-red-100 text-red-800' },
];

export const normalizeSentiment = (sentiment: string | null): string | null => {
  if (!sentiment) return null;
  
  const normalized = sentiment.toLowerCase().trim();
  
  switch (normalized) {
    case 'super engajado':
    case 'super_engajado':
      return SENTIMENT_VALUES.SUPER_ENGAJADO;
    case 'positivo':
      return SENTIMENT_VALUES.POSITIVO;
    case 'neutro':
      return SENTIMENT_VALUES.NEUTRO;
    case 'negativo':
      return SENTIMENT_VALUES.NEGATIVO;
    default:
      return sentiment;
  }
};

export const getSentimentOption = (sentiment: string | null) => {
  const normalizedSentiment = normalizeSentiment(sentiment);
  return SENTIMENT_OPTIONS.find(option => option.value === normalizedSentiment);
};