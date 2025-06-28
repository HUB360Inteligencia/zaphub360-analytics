
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Copy, Eye } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { TemplateForm } from './TemplateForm';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  content: string;
  category?: string;
  variables?: string[];
  template_tags?: { tag: string }[];
}

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface TemplateActionsProps {
  template: Template;
  categories: Category[];
  onPreview: (template: Template) => void;
}

export const TemplateActions = ({ template, categories, onPreview }: TemplateActionsProps) => {
  const { createTemplate, deleteTemplate } = useTemplates();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDuplicate = async () => {
    try {
      await createTemplate.mutateAsync({
        name: `${template.name} (Cópia)`,
        content: template.content,
        category: template.category,
        variables: template.variables || [],
        organization_id: '', // This will be set by the hook
      });
      toast.success('Template duplicado com sucesso!');
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTemplate.mutateAsync(template.id);
    } catch (error) {
      console.error('Erro ao excluir template:', error);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onPreview(template)}
      >
        <Eye className="w-4 h-4" />
      </Button>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
          </DialogHeader>
          <TemplateForm 
            categories={categories} 
            template={template}
            onSuccess={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleDuplicate}
        disabled={createTemplate.isPending}
      >
        <Copy className="w-4 h-4" />
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{template.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTemplate.isPending}
            >
              {deleteTemplate.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
