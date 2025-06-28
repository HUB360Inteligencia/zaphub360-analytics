import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Plus, Edit, Trash2, Copy, Eye, MessageSquare, 
  FileText, Star, Users, Calendar, Megaphone, Gift,
  Variable, Zap, BarChart3
} from 'lucide-react';

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

  const renderVariables = (variables: string[]) => {
    return variables.map(variable => (
      <Badge key={variable} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
        {`{{${variable}}}`}
      </Badge>
    ));
  };

  const previewContent = (content: string, variables: string[]) => {
    let preview = content;
    variables.forEach(variable => {
      const placeholder = `{{${variable}}}`;
      const sampleData: { [key: string]: string } = {
        nome: 'João Silva',
        evento_nome: 'Reunião Comunitária',
        local: 'Centro Comunitário',
        data: '25/01/2024',
        horario: '19:00',
        assinatura: 'Equipe G360-Wpp',
        semana: 'Semana de 15 a 21 de Janeiro',
        titulo_1: 'Nova praça inaugurada',
        resumo_1: 'A nova praça do bairro foi inaugurada com grande participação.',
        area_atuacao: 'saúde pública',
        descricao_promocao: 'Curso gratuito de capacitação profissional',
        beneficio_principal: 'Certificado reconhecido pelo MEC',
        porcentagem_desconto: '100',
        data_validade: '31/01/2024',
        link: 'https://exemplo.com',
        titulo_reuniao: 'Planejamento 2024'
      };
      preview = preview.replace(new RegExp(placeholder, 'g'), sampleData[variable] || placeholder);
    });
    return preview;
  };

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
            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Nome do Template *</Label>
                    <Input id="template-name" placeholder="Ex: Convite para Evento" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="template-category">Categoria *</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="template-description">Descrição</Label>
                  <Input id="template-description" placeholder="Breve descrição do template..." className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="template-content">Conteúdo da Mensagem *</Label>
                  <Textarea 
                    id="template-content" 
                    placeholder="Digite o conteúdo da mensagem...&#10;&#10;Use {{variavel}} para campos dinâmicos.&#10;Exemplo: Olá {{nome}}, você está convidado para {{evento}}." 
                    className="mt-1 min-h-[200px] font-mono text-sm"
                  />
                </div>

                <div>
                  <Label>Variáveis Detectadas</Label>
                  <div className="mt-2 p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">
                      As variáveis serão detectadas automaticamente quando você usar o formato {"{{variavel}}"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">{"{{nome}}"}</Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">{"{{evento}}"}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template-tags">Tags (separadas por vírgula)</Label>
                  <Input id="template-tags" placeholder="evento, convite, politica" className="mt-1" />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg p-4 bg-white">
                  <h4 className="font-semibold mb-2">Pré-visualização</h4>
                  <div className="bg-slate-50 p-4 rounded border text-sm whitespace-pre-wrap font-mono">
                    Olá João Silva, você está convidado para Reunião Comunitária.
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Templates</p>
                <p className="text-2xl font-bold text-slate-900">{templates.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Templates Ativos</p>
                <p className="text-2xl font-bold text-slate-900">
                  {templates.filter(t => t.isActive).length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Mais Usado</p>
                <p className="text-2xl font-bold text-slate-900">Newsletter</p>
                <p className="text-xs text-slate-500">128 usos</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Categorias</p>
                <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
              </div>
              <Variable className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Filter */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('all')}
              className={categoryFilter === 'all' ? 'bg-slate-900' : ''}
            >
              Todas ({templates.length})
            </Button>
            {categories.map(category => {
              const count = templates.filter(t => t.category === category.id).length;
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={categoryFilter === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(category.id)}
                  className={categoryFilter === category.id ? '' : 'hover:bg-slate-50'}
                  style={categoryFilter === category.id ? { backgroundColor: category.color } : {}}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {category.name} ({count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
          const IconComponent = category?.icon || FileText;
          
          return (
            <Card key={template.id} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-sm">{template.description}</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ borderColor: category?.color, color: category?.color }}
                  >
                    {category?.name}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Content Preview */}
                <div>
                  <Label className="text-sm font-medium">Prévia do Conteúdo</Label>
                  <div className="mt-1 p-3 bg-slate-50 rounded text-sm max-h-32 overflow-hidden">
                    {template.content.substring(0, 150)}...
                  </div>
                </div>

                {/* Variables */}
                <div>
                  <Label className="text-sm font-medium">Variáveis ({template.variables.length})</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {template.variables.slice(0, 4).map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                    {template.variables.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.variables.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Usado {template.usageCount} vezes</span>
                  <span>Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Usar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewTemplate.name}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="original" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="original">Conteúdo Original</TabsTrigger>
                <TabsTrigger value="preview">Com Dados de Exemplo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="original" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium">Variáveis Disponíveis</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {renderVariables(previewTemplate.variables)}
                    </div>
                  </div>
                  <div>
                    <Label className="font-medium">Conteúdo do Template</Label>
                    <div className="mt-2 p-4 bg-slate-50 rounded border font-mono text-sm whitespace-pre-wrap">
                      {previewTemplate.content}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-4">
                <div>
                  <Label className="font-medium">Pré-visualização com Dados de Exemplo</Label>
                  <div className="mt-2 p-4 bg-white border rounded whitespace-pre-wrap text-sm">
                    {previewContent(previewTemplate.content, previewTemplate.variables)}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                Fechar
              </Button>
              <Button>Usar Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Templates;
