
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Calendar, Megaphone, Gift, Users, BarChart3, Loader2 } from 'lucide-react';
import { StatsCards } from '@/components/templates/StatsCards';
import { CategoryFilter } from '@/components/templates/CategoryFilter';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplateForm } from '@/components/templates/TemplateForm';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { useTemplates } from '@/hooks/useTemplates';

const Templates = () => {
  const { templates, isLoading, createTemplate } = useTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // Categorias padrão
  const categories = [
    { id: 'eventos', name: 'Eventos', icon: Calendar, color: '#2563EB' },
    { id: 'informativo', name: 'Informativo', icon: Megaphone, color: '#7C3AED' },
    { id: 'feedback', name: 'Feedback', icon: BarChart3, color: '#059669' },
    { id: 'marketing', name: 'Marketing', icon: Gift, color: '#DC2626' },
    { id: 'atendimento', name: 'Atendimento', icon: Users, color: '#D97706' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.template_tags?.some(tag => 
                           tag.tag.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryById = (categoryId: string) => categories.find(cat => cat.id === categoryId);

  // Calcular estatísticas
  const totalTemplates = templates.length;
  const activeTemplates = templates.length; // Todos são considerados ativos por padrão
  const mostUsedTemplate = templates.reduce((max, template) => 
    (template.usage_count || 0) > (max.usage_count || 0) ? template : max, 
    templates[0] || { name: 'N/A', usage_count: 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Templates de Mensagens</h1>
          <p className="text-slate-600">Crie e gerencie templates reutilizáveis</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
            </DialogHeader>
            <TemplateForm categories={categories} />
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button>Salvar Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalTemplates={totalTemplates}
        activeTemplates={activeTemplates}
        mostUsedTemplate={mostUsedTemplate.name}
        mostUsedCount={mostUsedTemplate.usage_count || 0}
        categoriesCount={categories.length}
      />

      {/* Categories Filter */}
      <CategoryFilter
        categories={categories}
        templates={templates}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />

      {/* Search */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar templates por nome, conteúdo ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const category = getCategoryById(template.category || '');
            return (
              <TemplateCard
                key={template.id}
                template={{
                  ...template,
                  usageCount: template.usage_count || 0,
                  createdAt: template.created_at,
                  lastUsed: template.updated_at,
                  isActive: true,
                  tags: template.template_tags?.map(t => t.tag) || [],
                  variables: template.variables || []
                }}
                category={category}
                onPreview={setPreviewTemplate}
              />
            );
          })}
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
                  {searchTerm || categoryFilter !== 'all' ? 'Nenhum template encontrado' : 'Nenhum template criado'}
                </h3>
                <p className="text-slate-600 mb-4">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca para encontrar templates.'
                    : 'Comece criando seu primeiro template de mensagem para automatizar suas comunicações.'
                  }
                </p>
                {!searchTerm && categoryFilter === 'all' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Template
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <TemplatePreview
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
};

export default Templates;
