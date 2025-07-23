import React, { useState } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, MessageSquare, Image, Video, Mic, MapPin, Menu, User, FileText } from 'lucide-react';
import { MessageContentForm } from '@/components/templates/MessageContentForm';
import { MessageContentCard } from '@/components/templates/MessageContentCard';
import { StatsCards } from '@/components/templates/StatsCards';
import { CategoryFilter } from '@/components/templates/CategoryFilter';

const MessageContent = () => {
  const { templates, isLoading } = useTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Categorias com ícones e cores específicas para tipos de conteúdo
  const contentTypes = [
    { id: 'all', name: 'Todos', icon: Menu, color: 'bg-gray-100 text-gray-600' },
    { id: 'texto', name: 'Texto', icon: MessageSquare, color: 'bg-blue-100 text-blue-600' },
    { id: 'imagem', name: 'Imagem', icon: Image, color: 'bg-green-100 text-green-600' },
    { id: 'video', name: 'Vídeo', icon: Video, color: 'bg-purple-100 text-purple-600' },
    { id: 'audio', name: 'Áudio', icon: Mic, color: 'bg-orange-100 text-orange-600' },
    { id: 'localizacao', name: 'Localização', icon: MapPin, color: 'bg-red-100 text-red-600' },
    { id: 'botoes', name: 'Botões', icon: Menu, color: 'bg-yellow-100 text-yellow-600' },
    { id: 'contato', name: 'Contato', icon: User, color: 'bg-indigo-100 text-indigo-600' },
    { id: 'documento', name: 'Documento', icon: FileText, color: 'bg-pink-100 text-pink-600' },
  ];

  // Filtrar templates baseado no termo de busca e categoria
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
                           (template.tipo_conteudo && template.tipo_conteudo.includes(categoryFilter));
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryById = (categoryId: string) => {
    return contentTypes.find(cat => cat.id === categoryId);
  };

  // Estatísticas dos templates
  const stats = {
    total: templates.length,
    active: templates.filter(t => t.usage_count && t.usage_count > 0).length,
    mostUsed: templates.reduce((prev, current) => 
      (current.usage_count || 0) > (prev.usage_count || 0) ? current : prev, 
      templates[0]
    )?.name || 'Nenhum'
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conteúdo de Mensagem</h1>
          <p className="text-muted-foreground">
            Gerencie diferentes tipos de conteúdo para suas campanhas
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Conteúdo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Conteúdo de Mensagem</DialogTitle>
            </DialogHeader>
            <MessageContentForm 
              contentTypes={contentTypes}
              onSuccess={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estatísticas */}
      <StatsCards 
        totalTemplates={stats.total}
        activeTemplates={stats.active}
        mostUsedTemplate={stats.mostUsed}
        mostUsedCount={templates.reduce((maxUsage, current) => 
          Math.max(maxUsage, current.usage_count || 0), 
          0
        )}
        categoriesCount={contentTypes.length - 1}
      />

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <CategoryFilter 
          categories={contentTypes}
          templates={templates}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
        />
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar conteúdo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Grid de Templates */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || categoryFilter !== 'all' 
              ? 'Nenhum conteúdo encontrado' 
              : 'Nenhum conteúdo criado'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || categoryFilter !== 'all'
              ? 'Tente ajustar os filtros para encontrar o conteúdo desejado'
              : 'Comece criando seu primeiro conteúdo de mensagem'}
          </p>
          {(!searchTerm && categoryFilter === 'all') && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Conteúdo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Conteúdo de Mensagem</DialogTitle>
                </DialogHeader>
                <MessageContentForm 
                  contentTypes={contentTypes}
                  onSuccess={() => setCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <MessageContentCard
              key={template.id}
              template={template}
              contentTypes={contentTypes}
              onPreview={(template) => {
                // TODO: Implementar preview modal
                console.log('Preview template:', template);
              }}
              onUse={(template) => {
                // TODO: Implementar uso do template
                console.log('Use template:', template);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageContent;