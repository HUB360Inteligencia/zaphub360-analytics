import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Calendar, Megaphone, Gift, Users, BarChart3 } from 'lucide-react';
import { StatsCards } from '@/components/templates/StatsCards';
import { CategoryFilter } from '@/components/templates/CategoryFilter';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplateForm } from '@/components/templates/TemplateForm';
import { TemplatePreview } from '@/components/templates/TemplatePreview';

const Templates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // Mock data - em produção seria do Supabase
  const categories = [
    { id: 'eventos', name: 'Eventos', icon: Calendar, color: '#2563EB' },
    { id: 'informativo', name: 'Informativo', icon: Megaphone, color: '#7C3AED' },
    { id: 'feedback', name: 'Feedback', icon: BarChart3, color: '#059669' },
    { id: 'marketing', name: 'Marketing', icon: Gift, color: '#DC2626' },
    { id: 'atendimento', name: 'Atendimento', icon: Users, color: '#D97706' }
  ];

  const templates = [
    {
      id: 1,
      name: 'Convite para Evento',
      description: 'Template para convidar contatos para eventos políticos',
      category: 'eventos',
      content: `Olá {{nome}}! 🎉

Você está convidado(a) para nosso evento especial:

📅 **{{evento_nome}}**
📍 Local: {{local}}
🕒 Data: {{data}} às {{horario}}

Sua presença é muito importante para nós! 

Para confirmar sua participação, responda esta mensagem com SIM.

Esperamos você lá!

Atenciosamente,
{{assinatura}}`,
      variables: ['nome', 'evento_nome', 'local', 'data', 'horario', 'assinatura'],
      usageCount: 45,
      createdAt: '2024-01-10',
      lastUsed: '2024-01-15',
      isActive: true,
      tags: ['evento', 'convite', 'politica']
    },
    {
      id: 2,
      name: 'Newsletter Semanal',
      description: 'Informativo semanal com principais notícias',
      category: 'informativo',
      content: `📰 **Newsletter Semanal** - {{semana}}

Olá {{nome}}, confira os principais acontecimentos:

🔸 **{{titulo_1}}**
{{resumo_1}}

🔸 **{{titulo_2}}**
{{resumo_2}}

🔸 **{{titulo_3}}**
{{resumo_3}}

📱 Siga nossas redes sociais para mais atualizações!

{{assinatura}}`,
      variables: ['nome', 'semana', 'titulo_1', 'resumo_1', 'titulo_2', 'resumo_2', 'titulo_3', 'resumo_3', 'assinatura'],
      usageCount: 128,
      createdAt: '2024-01-05',
      lastUsed: '2024-01-14',
      isActive: true,
      tags: ['newsletter', 'informativo', 'semanal']
    },
    {
      id: 3,
      name: 'Pesquisa de Satisfação',
      description: 'Template para coletar feedback dos cidadãos',
      category: 'feedback',
      content: `Olá {{nome}}! 📊

Sua opinião é muito importante para nós!

Gostaríamos de saber como você avalia nosso trabalho em {{area_atuacao}}.

Por favor, responda com uma nota de 1 a 10:

1️⃣ Muito insatisfeito
🔟 Muito satisfeito

Também pode deixar um comentário com sugestões!

Obrigado pela colaboração!

{{assinatura}}`,
      variables: ['nome', 'area_atuacao', 'assinatura'],
      usageCount: 67,
      createdAt: '2024-01-08',
      lastUsed: '2024-01-12',
      isActive: true,
      tags: ['pesquisa', 'feedback', 'satisfacao']
    },
    {
      id: 4,
      name: 'Promoção Especial',
      description: 'Template para campanhas promocionais',
      category: 'marketing',
      content: `🎁 **OFERTA ESPECIAL** para você, {{nome}}!

{{descricao_promocao}}

✨ **{{beneficio_principal}}**
💰 Desconto: {{porcentagem_desconto}}%
⏰ Válido até: {{data_validade}}

Para aproveitar, acesse: {{link}}
Ou responda esta mensagem!

Não perca essa oportunidade!

{{assinatura}}`,
      variables: ['nome', 'descricao_promocao', 'beneficio_principal', 'porcentagem_desconto', 'data_validade', 'link', 'assinatura'],
      usageCount: 23,
      createdAt: '2024-01-12',
      lastUsed: '2024-01-13',
      isActive: true,
      tags: ['promocao', 'marketing', 'desconto']
    },
    {
      id: 5,
      name: 'Confirmação de Presença',
      description: 'Template para confirmação de participação em reuniões',
      category: 'eventos',
      content: `Oi {{nome}}! ✅

Lembrando sobre nossa reunião:

📋 **{{titulo_reuniao}}**
📅 Data: {{data}}
🕒 Horário: {{horario}}
📍 Local: {{local}}

Por favor, confirme sua presença respondendo:
✅ SIM - Estarei presente
❌ NÃO - Não poderei comparecer

Aguardamos seu retorno!

{{assinatura}}`,
      variables: ['nome', 'titulo_reuniao', 'data', 'horario', 'local', 'assinatura'],
      usageCount: 89,
      createdAt: '2024-01-06',
      lastUsed: '2024-01-11',
      isActive: true,
      tags: ['confirmacao', 'reuniao', 'presenca']
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryById = (categoryId: string) => categories.find(cat => cat.id === categoryId);

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
        totalTemplates={templates.length}
        activeTemplates={templates.filter(t => t.isActive).length}
        mostUsedTemplate="Newsletter"
        mostUsedCount={128}
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
              placeholder="Buscar templates por nome, descrição ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const category = getCategoryById(template.category);
          return (
            <TemplateCard
              key={template.id}
              template={template}
              category={category}
              onPreview={setPreviewTemplate}
            />
          );
        })}
      </div>

      {/* Preview Dialog */}
      <TemplatePreview
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
};

export default Templates;
