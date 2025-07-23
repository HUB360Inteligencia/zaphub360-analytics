import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Loader2 } from 'lucide-react';
import { StatsCards } from '@/components/templates/StatsCards';
import { MessageContentCard } from '@/components/templates/MessageContentCard';
import { MessageContentForm } from '@/components/templates/MessageContentForm';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { CategoryFilter } from '@/components/templates/CategoryFilter';
import { useTemplates } from '@/hooks/useTemplates';

const MessageContent = () => {
  const { templates, isLoading } = useTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalTemplates = templates.length;
  const activeTemplates = templates.length;
  const mostUsedTemplate = templates.reduce((max, template) => 
    (template.usage_count || 0) > (max.usage_count || 0) ? template : max, 
    templates[0] || { name: 'N/A', usage_count: 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Conteúdo da Mensagem</h1>
          <p className="text-slate-600">Crie e gerencie conteúdos com formatos padronizados EVO API</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Conteúdo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Conteúdo</DialogTitle>
            </DialogHeader>
            <MessageContentForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <StatsCards
        totalTemplates={totalTemplates}
        activeTemplates={activeTemplates}
        mostUsedTemplate={mostUsedTemplate.name}
        mostUsedCount={mostUsedTemplate.usage_count || 0}
        categoriesCount={13}
      />

      <CategoryFilter
        templates={templates}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />

      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar conteúdo por nome ou texto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <MessageContentCard
              key={template.id}
              template={template}
              onPreview={setPreviewTemplate}
              onEdit={setEditingTemplate}
              onUse={(template) => console.log('Usar template:', template)}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {searchTerm ? 'Nenhum conteúdo encontrado' : 'Nenhum conteúdo criado'}
                </h3>
                <p className="text-slate-600 mb-4">
                  {searchTerm ? 'Tente ajustar a busca.' : 'Comece criando seu primeiro conteúdo.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Conteúdo
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Edição */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Conteúdo</DialogTitle>
          </DialogHeader>
          <MessageContentForm 
            template={editingTemplate}
            onSuccess={() => setEditingTemplate(null)} 
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Preview */}
      <TemplatePreview
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={(template) => console.log('Usar template:', template)}
      />
    </div>
  );
};

export default MessageContent;