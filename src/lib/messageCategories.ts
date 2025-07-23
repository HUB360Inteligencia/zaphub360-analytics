import { 
  Mail, 
  Calendar, 
  Megaphone, 
  Bot 
} from 'lucide-react';

export interface MessageCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  useCases: string[];
  recommendedFormats: string[];
}

export const MESSAGE_CATEGORIES: MessageCategory[] = [
  {
    id: 'newsletter',
    name: 'NewsLetter',
    description: 'Boletins informativos e comunicados regulares',
    icon: Mail,
    color: 'hsl(210, 100%, 56%)', // Blue
    useCases: [
      'Novidades da empresa',
      'Atualizações de produtos',
      'Dicas e conteúdo educativo',
      'Comunicados gerais'
    ],
    recommendedFormats: ['texto', 'imagem-texto', 'documento']
  },
  {
    id: 'convite-evento',
    name: 'Convite Evento',
    description: 'Convites para eventos, webinars e encontros',
    icon: Calendar,
    color: 'hsl(142, 71%, 45%)', // Green
    useCases: [
      'Convites para webinars',
      'Eventos presenciais',
      'Reuniões e workshops',
      'Lançamentos de produtos'
    ],
    recommendedFormats: ['texto-localizacao', 'imagem-botao', 'texto-botao']
  },
  {
    id: 'campanha-mensagens',
    name: 'Campanha de Mensagens',
    description: 'Campanhas de marketing e vendas diretas',
    icon: Megaphone,
    color: 'hsl(271, 81%, 56%)', // Purple
    useCases: [
      'Promoções e ofertas',
      'Lançamento de produtos',
      'Captação de leads',
      'Vendas diretas'
    ],
    recommendedFormats: ['texto-botao', 'imagem-botao', 'video-botao']
  },
  {
    id: 'automacoes',
    name: 'Automações',
    description: 'Mensagens automáticas e fluxos de resposta',
    icon: Bot,
    color: 'hsl(25, 95%, 53%)', // Orange
    useCases: [
      'Mensagens de boas-vindas',
      'Respostas automáticas',
      'Sequências de follow-up',
      'Mensagens de confirmação'
    ],
    recommendedFormats: ['texto', 'texto-botao', 'botoes-interativos']
  }
];

// Função para obter categoria por ID
export const getCategoryById = (id: string): MessageCategory | undefined => {
  return MESSAGE_CATEGORIES.find(category => category.id === id);
};

// Função para obter categorias recomendadas por formato
export const getCategoriesByFormat = (formatId: string): MessageCategory[] => {
  return MESSAGE_CATEGORIES.filter(category => 
    category.recommendedFormats.includes(formatId)
  );
};

// Mapeamento de categorias antigas para novas
export const CATEGORY_MIGRATION_MAP: Record<string, string> = {
  'Vendas': 'campanha-mensagens',
  'Marketing': 'newsletter',
  'Suporte': 'automacoes',
  'Eventos': 'convite-evento',
  'vendas': 'campanha-mensagens',
  'marketing': 'newsletter',
  'suporte': 'automacoes',
  'eventos': 'convite-evento'
};

// Função para migrar categoria antiga para nova
export const migrateCategoryId = (oldCategory: string): string => {
  return CATEGORY_MIGRATION_MAP[oldCategory] || 'campanha-mensagens';
};

// Validações específicas por categoria
export const validateCategoryRequirements = (
  categoryId: string, 
  templateData: any
): { isValid: boolean; errors: string[] } => {
  const category = getCategoryById(categoryId);
  if (!category) return { isValid: true, errors: [] };

  const errors: string[] = [];

  switch (categoryId) {
    case 'newsletter':
      if (!templateData.content || templateData.content.length < 50) {
        errors.push('NewsLetters devem ter pelo menos 50 caracteres de conteúdo');
      }
      break;

    case 'convite-evento':
      if (!templateData.latitude && !templateData.longitude && !templateData.content.includes('{{data}}')) {
        errors.push('Convites de evento devem ter localização ou data do evento');
      }
      break;

    case 'campanha-mensagens':
      if (!templateData.botoes && !templateData.content.includes('{{cta}}')) {
        errors.push('Campanhas de mensagem devem ter botões ou call-to-action');
      }
      break;

    case 'automacoes':
      // Automações são mais flexíveis, apenas validação básica
      if (!templateData.content || templateData.content.length < 10) {
        errors.push('Automações devem ter conteúdo mínimo');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};