
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useTemplates } from '@/hooks/useTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface TemplateFormProps {
  categories: Category[];
  onSuccess?: () => void;
  template?: any;
}

const templateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  content: z.string().min(1, 'Conteúdo é obrigatório').max(2000, 'Conteúdo muito longo'),
  tags: z.string().optional(),
});

export const TemplateForm = ({ categories, onSuccess, template }: TemplateFormProps) => {
  const { organization } = useAuth();
  const { createTemplate, updateTemplate } = useTemplates();
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [previewContent, setPreviewContent] = useState('');

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || '',
      category: template?.category || '',
      content: template?.content || '',
      tags: template?.template_tags?.map((t: any) => t.tag).join(', ') || '',
    },
  });

  const watchedContent = form.watch('content');

  // Detect variables in real-time
  useEffect(() => {
    const variables = extractVariables(watchedContent);
    setDetectedVariables(variables);
    setPreviewContent(generatePreview(watchedContent, variables));
  }, [watchedContent]);

  const extractVariables = (content: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(regex) || [];
    return [...new Set(matches.map(match => match.replace(/[{}]/g, '')))];
  };

  const generatePreview = (content: string, variables: string[]): string => {
    let preview = content;
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

    variables.forEach(variable => {
      const placeholder = `{{${variable}}}`;
      preview = preview.replace(new RegExp(placeholder, 'g'), sampleData[variable] || `[${variable}]`);
    });

    return preview;
  };

  const onSubmit = async (values: z.infer<typeof templateSchema>) => {
    if (!organization?.id) {
      toast.error('Organização não encontrada');
      return;
    }

    try {
      const templateData = {
        name: values.name,
        content: values.content,
        category: values.category,
        variables: detectedVariables,
        organization_id: organization.id,
      };

      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, ...templateData });
      } else {
        await createTemplate.mutateAsync(templateData);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Template *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Convite para Evento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo da Mensagem *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite o conteúdo da mensagem...&#10;&#10;Use {{variavel}} para campos dinâmicos.&#10;Exemplo: Olá {{nome}}, você está convidado para {{evento}}." 
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>Variáveis Detectadas ({detectedVariables.length})</Label>
              <div className="mt-2 p-4 bg-slate-50 rounded-lg">
                {detectedVariables.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detectedVariables.map(variable => (
                      <Badge key={variable} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    Use {"{{variavel}}"} no conteúdo para criar campos dinâmicos
                  </p>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (separadas por vírgula)</FormLabel>
                  <FormControl>
                    <Input placeholder="evento, convite, politica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-4 bg-white">
              <h4 className="font-semibold mb-2">Pré-visualização</h4>
              <div className="bg-slate-50 p-4 rounded border text-sm whitespace-pre-wrap">
                {previewContent || 'Digite o conteúdo no editor para ver a pré-visualização...'}
              </div>
            </div>
            
            {detectedVariables.length > 0 && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold mb-2 text-blue-800">Variáveis Utilizadas</h4>
                <div className="flex flex-wrap gap-2">
                  {detectedVariables.map(variable => (
                    <Badge key={variable} variant="secondary" className="bg-blue-100 text-blue-800">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button 
            type="submit" 
            disabled={createTemplate.isPending || updateTemplate.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createTemplate.isPending || updateTemplate.isPending ? 'Salvando...' : (template ? 'Atualizar Template' : 'Salvar Template')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
