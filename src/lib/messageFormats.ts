import { MessageSquare, MapPin, MousePointer, Contact, Image, Volume2, Video, FileText } from 'lucide-react';

export interface MessageFormat {
  id: string;
  name: string;
  description: string;
  requiredFields: string[];
  icon: React.ComponentType<any>;
  color: string;
}

export const MESSAGE_FORMATS: MessageFormat[] = [
  {
    id: '0001',
    name: 'Texto',
    description: 'Mensagem de texto simples',
    requiredFields: ['content'],
    icon: MessageSquare,
    color: '#3B82F6'
  },
  {
    id: '0002',
    name: 'Texto + Localização',
    description: 'Texto com localização compartilhada',
    requiredFields: ['content', 'latitude', 'longitude'],
    icon: MapPin,
    color: '#10B981'
  },
  {
    id: '0003',
    name: 'Texto + Botão',
    description: 'Texto com botões interativos',
    requiredFields: ['content', 'botoes'],
    icon: MousePointer,
    color: '#8B5CF6'
  },
  {
    id: '0004',
    name: 'Texto + Texto',
    description: 'Mensagem principal com texto adicional',
    requiredFields: ['content', 'mensagem_extra'],
    icon: MessageSquare,
    color: '#06B6D4'
  },
  {
    id: '0005',
    name: 'Texto + Contato',
    description: 'Texto com cartão de contato',
    requiredFields: ['content', 'contato_nome', 'contato_numero'],
    icon: Contact,
    color: '#F59E0B'
  },
  {
    id: '0006',
    name: 'Imagem',
    description: 'Envio de imagem com legenda opcional',
    requiredFields: ['media_url', 'media_type'],
    icon: Image,
    color: '#EF4444'
  },
  {
    id: '0007',
    name: 'Imagem + Botão',
    description: 'Imagem com botões interativos',
    requiredFields: ['media_url', 'media_type', 'botoes'],
    icon: Image,
    color: '#EC4899'
  },
  {
    id: '0008',
    name: 'Imagem + Texto',
    description: 'Imagem com texto adicional',
    requiredFields: ['media_url', 'media_type', 'content'],
    icon: Image,
    color: '#84CC16'
  },
  {
    id: '0009',
    name: 'Imagem + Localização',
    description: 'Imagem com localização compartilhada',
    requiredFields: ['media_url', 'media_type', 'latitude', 'longitude'],
    icon: Image,
    color: '#06B6D4'
  },
  {
    id: '0010',
    name: 'Áudio',
    description: 'Envio de arquivo de áudio',
    requiredFields: ['media_url', 'media_type'],
    icon: Volume2,
    color: '#8B5CF6'
  },
  {
    id: '0011',
    name: 'Áudio + Texto',
    description: 'Áudio com mensagem de texto',
    requiredFields: ['media_url', 'media_type', 'content'],
    icon: Volume2,
    color: '#F59E0B'
  },
  {
    id: '0012',
    name: 'Áudio + Imagem',
    description: 'Áudio com imagem de capa',
    requiredFields: ['media_url', 'media_type', 'caption'],
    icon: Volume2,
    color: '#EF4444'
  },
  {
    id: '0013',
    name: 'Vídeo',
    description: 'Envio de arquivo de vídeo',
    requiredFields: ['media_url', 'media_type'],
    icon: Video,
    color: '#DC2626'
  }
];

export const getFormatById = (id: string): MessageFormat | undefined => {
  return MESSAGE_FORMATS.find(format => format.id === id);
};

export const getRequiredContentTypes = (formatId: string): string[] => {
  const format = getFormatById(formatId);
  if (!format) return ['texto'];

  const contentTypes: string[] = [];
  
  // Determinar tipos de conteúdo baseado nos campos obrigatórios
  if (format.requiredFields.includes('content') || format.requiredFields.includes('mensagem_extra')) {
    contentTypes.push('texto');
  }
  
  if (format.requiredFields.includes('media_url')) {
    if (formatId.includes('Imagem') || formatId === '0006' || formatId === '0007' || formatId === '0008' || formatId === '0009') {
      contentTypes.push('imagem');
    } else if (formatId.includes('Áudio') || formatId === '0010' || formatId === '0011' || formatId === '0012') {
      contentTypes.push('audio');
    } else if (formatId.includes('Vídeo') || formatId === '0013') {
      contentTypes.push('video');
    }
  }
  
  if (format.requiredFields.includes('latitude') && format.requiredFields.includes('longitude')) {
    contentTypes.push('localizacao');
  }
  
  if (format.requiredFields.includes('botoes')) {
    contentTypes.push('botoes');
  }
  
  if (format.requiredFields.includes('contato_nome')) {
    contentTypes.push('contato');
  }

  return contentTypes.length > 0 ? contentTypes : ['texto'];
};

export const generateFileName = (templateName: string, fileExtension: string): string => {
  // Sanitizar nome do template
  const sanitizedName = templateName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  // Adicionar timestamp para garantir unicidade
  const timestamp = Date.now();
  
  return `${sanitizedName}_${timestamp}.${fileExtension}`;
};