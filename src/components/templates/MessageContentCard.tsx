import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, Play, MoreVertical, Edit, Trash2, Copy } from 'lucide-react';
import { Template } from '@/hooks/useTemplates';
import { getFormatById } from '@/lib/messageFormats';

interface MessageContentCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onUse?: (template: Template) => void;
}

export const MessageContentCard: React.FC<MessageContentCardProps> = ({
  template,
  onPreview,
  onUse
}) => {
  const format = getFormatById(template.formato_id || '');

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

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{template.name}</h3>
            {format && (
              <Badge variant="secondary" className="text-xs mb-2">
                {format.id} - {format.name}
              </Badge>
            )}
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
        <div className="space-y-3">
          {template.content && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Conteúdo:</p>
              <p className="text-sm bg-muted p-2 rounded text-wrap break-words">
                {truncateContent(template.content)}
              </p>
            </div>
          )}

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