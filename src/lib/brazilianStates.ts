export const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
];

export const SENTIMENT_NORMALIZATION = {
  'super engajado': 'Super Engajado',
  'Super Engajado': 'Super Engajado',
  'super_engajado': 'Super Engajado',
  'positivo': 'Positivo',
  'Positivo': 'Positivo',
  'neutro': 'Neutro',
  'Neutro': 'Neutro',
  'negativo': 'Negativo',
  'Negativo': 'Negativo'
};

export const NORMALIZED_SENTIMENTS = [
  'Super Engajado',
  'Positivo', 
  'Neutro',
  'Negativo'
];

export const normalizeSentiment = (sentiment: string | null): string | null => {
  if (!sentiment) return null;
  
  const normalized = SENTIMENT_NORMALIZATION[sentiment as keyof typeof SENTIMENT_NORMALIZATION];
  return normalized || sentiment;
};

export const getSentimentColor = (sentiment?: string) => {
  if (!sentiment) return 'bg-gray-100 text-gray-600';
  
  const normalizedSentiment = normalizeSentiment(sentiment);
  
  switch (normalizedSentiment) {
    case 'Super Engajado':
      return 'bg-orange-100 text-orange-800';
    case 'Positivo':
      return 'bg-green-100 text-green-800';
    case 'Neutro':
      return 'bg-gray-100 text-gray-800';
    case 'Negativo':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};