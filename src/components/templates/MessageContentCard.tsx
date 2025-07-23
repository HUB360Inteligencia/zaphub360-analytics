import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Eye, Copy, Trash2, Image, Video, MapPin, MessageSquare, Phone, Edit, Loader2 } from 'lucide-react';
import { getFormatById } from '@/lib/messageFormats';
import { getCategoryById } from '@/lib/messageCategories';
import { Template, useTemplates } from '@/hooks/useTemplates';
import { useState } from 'react';
import { toast } from 'sonner';

interface MessageContentCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onUse?: (template: Template) => void;
  onEdit?: (template: Template) => void;
}

export const MessageContentCard = ({ template, onPreview, onUse, onEdit }: MessageContentCardProps) => {
  const { createTemplate, deleteTemplate } = useTemplates();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  
  const format = getFormatById(template.formato_id || '0001');

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const duplicatedTemplate = {
        ...template,
        name: `${template.name} (Cópia)`,
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
      };
      
      await createTemplate.mutateAsync(duplicatedTemplate);
      toast.success('Template duplicado com sucesso!');
    } catch (error) {
      toast.error('Erro ao duplicar template');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTemplate.mutateAsync(template.id);
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error('Erro ao excluir template');
    } finally {
      setIsDeleting(false);
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2).trim()) : [];
  };

  const variables = extractVariables(template.content);

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {format?.icon && <format.icon className="w-5 h-5" />}
                {template.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {format && (
                  <Badge variant="outline" style={{ color: format.color }}>
                    {format.name}
                  </Badge>
                )}
                {getCategoryById(template.category || '') && (
                  <Badge 
                    variant="secondary" 
                    style={{ 
                      backgroundColor: `${getCategoryById(template.category || '')?.color}20`,
                      color: getCategoryById(template.category || '')?.color,
                      borderColor: getCategoryById(template.category || '')?.color 
                    }}
                  >
                    {getCategoryById(template.category || '')?.name}
                  </Badge>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPreview(template)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(template)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                  {isDuplicating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600" 
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Conteúdo da mensagem */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Conteúdo:</p>
            <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">
              {truncateContent(template.content)}
            </p>
          </div>

          {/* Indicadores de conteúdo */}
          <div className="flex flex-wrap gap-2">
            {template.media_url && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Image className="w-3 h-3" />
                Mídia
              </div>
            )}
            {template.latitude && template.longitude && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                Localização
              </div>
            )}
            {template.botoes && template.botoes.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                {template.botoes.length} Botão(ões)
              </div>
            )}
            {template.contato_nome && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" />
                Contato
              </div>
            )}
          </div>

          {/* Variáveis */}
          {variables.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Variáveis:</p>
              <div className="flex flex-wrap gap-1">
                {variables.slice(0, 3).map(variable => (
                  <Badge key={variable} variant="outline" className="text-xs">
                    {`{{${variable}}}`}
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

          {/* Footer com ações */}
          <div className="flex justify-between items-center pt-3 border-t">
            <div className="text-xs text-muted-foreground">
              Uso: {template.usage_count || 0}x
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onPreview(template)}>
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              {onUse && (
                <Button size="sm" onClick={() => onUse(template)}>
                  Usar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{template.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};