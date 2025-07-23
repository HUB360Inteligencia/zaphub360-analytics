import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, Play, MoreVertical, Edit, Trash2, Copy } from 'lucide-react';
import { Template } from '@/hooks/useTemplates';


interface ContentType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface MessageContentCardProps {
  template: Template;
  contentTypes: ContentType[];
  onPreview: (template: Template) => void;
  onUse?: (template: Template) => void;
}

export const MessageContentCard: React.FC<MessageContentCardProps> = ({
  template,
  contentTypes,
  onPreview,
  onUse
}) => {
  // Obter ícones e cores dos tipos de conteúdo
  const getContentTypeInfo = (typeId: string) => {
    return contentTypes.find(ct => ct.id === typeId);
  };

  // Truncar conteúdo para preview
  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  // Extrair variáveis do conteúdo
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2).trim()) : [];
  };

  const variables = extractVariables(template.content);
  const tiposConteudo = template.tipo_conteudo || ['texto'];

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{template.name}</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {tiposConteudo.map(tipo => {
                const typeInfo = getContentTypeInfo(tipo);
                if (!typeInfo) return null;
                const Icon = typeInfo.icon;
                return (
                  <Badge key={tipo} variant="secondary" className="text-xs">
                    <Icon className="h-3 w-3 mr-1" />
                    {typeInfo.name}
                  </Badge>
                );
              })}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {/* Preview do conteúdo */}
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Conteúdo:</p>
            <p className="text-sm bg-muted p-2 rounded text-wrap break-words">
              {truncateContent(template.content)}
            </p>
          </div>

          {/* Informações específicas por tipo */}
          {template.media_url && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Mídia:</p>
              <p className="text-xs text-blue-600 truncate">{template.media_name || 'Arquivo de mídia'}</p>
            </div>
          )}

          {template.botoes && template.botoes.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Botões:</p>
              <div className="flex flex-wrap gap-1">
                {template.botoes.slice(0, 3).map((botao, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {botao.texto}
                  </Badge>
                ))}
                {template.botoes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.botoes.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {(template.latitude && template.longitude) && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Localização:</p>
              <p className="text-xs text-green-600">
                {template.latitude.toFixed(4)}, {template.longitude.toFixed(4)}
              </p>
            </div>
          )}

          {/* Variáveis */}
          {variables.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Variáveis:</p>
              <div className="flex flex-wrap gap-1">
                {variables.slice(0, 3).map((variable, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {variable}
                  </Badge>
                ))}
                {variables.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{variables.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Estatísticas */}
          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>Categoria: {template.category}</span>
            <span>Uso: {template.usage_count || 0}x</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPreview(template)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
        {onUse && (
          <Button 
            size="sm" 
            onClick={() => onUse(template)}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-1" />
            Usar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};