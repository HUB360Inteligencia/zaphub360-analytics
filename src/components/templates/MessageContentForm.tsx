import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useTemplates } from '@/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface ContentType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface MessageContentFormProps {
  contentTypes: ContentType[];
  onSuccess: () => void;
  template?: any;
}

const messageContentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  tipo_conteudo: z.array(z.string()).min(1, 'Pelo menos um tipo de conteúdo é obrigatório'),
  media_url: z.string().optional(),
  media_type: z.string().optional(),
  media_name: z.string().optional(),
  caption: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  botoes: z.array(z.object({ texto: z.string() })).optional(),
  contato_nome: z.string().optional(),
  contato_numero: z.string().optional(),
  mensagem_extra: z.string().optional(),
});

export const MessageContentForm: React.FC<MessageContentFormProps> = ({
  contentTypes,
  onSuccess,
  template
}) => {
  const { organization } = useAuth();
  const { createTemplate, updateTemplate } = useTemplates();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(template?.tipo_conteudo || ['texto']);
  const [botoes, setBotoes] = useState<{ texto: string }[]>(template?.botoes || []);

  const form = useForm<z.infer<typeof messageContentSchema>>({
    resolver: zodResolver(messageContentSchema),
    defaultValues: {
      name: template?.name || '',
      category: template?.category || 'Vendas',
      content: template?.content || '',
      tipo_conteudo: template?.tipo_conteudo || ['texto'],
      media_url: template?.media_url || '',
      media_type: template?.media_type || '',
      media_name: template?.media_name || '',
      caption: template?.caption || '',
      latitude: template?.latitude || undefined,
      longitude: template?.longitude || undefined,
      botoes: template?.botoes || [],
      contato_nome: template?.contato_nome || '',
      contato_numero: template?.contato_numero || '',
      mensagem_extra: template?.mensagem_extra || '',
    },
  });

  const watchedContent = form.watch('content');
  const watchedTipoConteudo = form.watch('tipo_conteudo');

  // Extrair variáveis do conteúdo
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2).trim()) : [];
  };

  // Gerar preview do conteúdo
  const generatePreview = (content: string, variables: string[]): string => {
    let preview = content;
    variables.forEach(variable => {
      const placeholder = variable === 'nome' ? 'João Silva' : 
                         variable === 'empresa' ? 'Empresa XYZ' :
                         variable === 'produto' ? 'Produto ABC' :
                         `[${variable}]`;
      preview = preview.replace(new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g'), placeholder);
    });
    return preview;
  };

  const onSubmit = async (values: z.infer<typeof messageContentSchema>) => {
    if (!organization?.id) {
      toast.error('Organização não encontrada');
      return;
    }

    try {
      const templateData = {
        name: values.name,
        content: values.content,
        category: values.category,
        organization_id: organization.id,
        variables: extractVariables(values.content),
        tipo_conteudo: values.tipo_conteudo,
        media_url: values.media_url,
        media_type: values.media_type,
        media_name: values.media_name,
        caption: values.caption,
        latitude: values.latitude,
        longitude: values.longitude,
        botoes: selectedTypes.includes('botoes') ? botoes : undefined,
        contato_nome: values.contato_nome,
        contato_numero: values.contato_numero,
        mensagem_extra: values.mensagem_extra,
      };

      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, ...templateData });
      } else {
        await createTemplate.mutateAsync(templateData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar conteúdo:', error);
    }
  };

  const handleTypeChange = (typeId: string, checked: boolean) => {
    const newTypes = checked 
      ? [...selectedTypes, typeId]
      : selectedTypes.filter(t => t !== typeId);
    
    setSelectedTypes(newTypes);
    form.setValue('tipo_conteudo', newTypes);
  };

  const addButton = () => {
    setBotoes([...botoes, { texto: '' }]);
  };

  const removeButton = (index: number) => {
    const newBotoes = botoes.filter((_, i) => i !== index);
    setBotoes(newBotoes);
    form.setValue('botoes', newBotoes);
  };

  const updateButton = (index: number, texto: string) => {
    const newBotoes = [...botoes];
    newBotoes[index] = { texto };
    setBotoes(newBotoes);
    form.setValue('botoes', newBotoes);
  };

  const variables = extractVariables(watchedContent);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Conteúdo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Convite para evento" {...field} />
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
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Vendas">Vendas</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Suporte">Suporte</SelectItem>
                      <SelectItem value="Eventos">Eventos</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Tipos de Conteúdo */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Conteúdo *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {contentTypes.filter(type => type.id !== 'all').map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={selectedTypes.includes(type.id)}
                      onCheckedChange={(checked) => handleTypeChange(type.id, checked === true)}
                    />
                    <label htmlFor={type.id} className="flex items-center space-x-1 text-sm cursor-pointer">
                      <Icon className="h-4 w-4" />
                      <span>{type.name}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="editor" className="w-full">
              <TabsList>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto da Mensagem *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Digite o conteúdo da mensagem. Use {{variavel}} para campos dinâmicos."
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos específicos por tipo */}
                {selectedTypes.includes('imagem') || selectedTypes.includes('video') || selectedTypes.includes('audio') || selectedTypes.includes('documento') ? (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Configurações de Mídia</h4>
                    <FormField
                      control={form.control}
                      name="media_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL da Mídia</FormLabel>
                          <FormControl>
                            <Input placeholder="https://exemplo.com/arquivo.jpg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="caption"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legenda</FormLabel>
                          <FormControl>
                            <Input placeholder="Legenda da mídia" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : null}

                {selectedTypes.includes('localizacao') ? (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Localização</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="any"
                                placeholder="-23.5505" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="any"
                                placeholder="-46.6333" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ) : null}

                {selectedTypes.includes('botoes') ? (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Botões Interativos</h4>
                      <Button type="button" variant="outline" size="sm" onClick={addButton}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Botão
                      </Button>
                    </div>
                    {botoes.map((botao, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder="Texto do botão"
                          value={botao.texto}
                          onChange={(e) => updateButton(index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeButton(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {selectedTypes.includes('contato') ? (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Contato</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contato_nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Contato</FormLabel>
                            <FormControl>
                              <Input placeholder="João Silva" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contato_numero"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do Contato</FormLabel>
                            <FormControl>
                              <Input placeholder="+5541999999999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ) : null}
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Preview da Mensagem</h4>
                  <p className="whitespace-pre-wrap">{generatePreview(watchedContent, variables)}</p>
                </div>
                
                {variables.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Variáveis Detectadas</h4>
                    <div className="flex flex-wrap gap-2">
                      {variables.map((variable, index) => (
                        <Badge key={index} variant="secondary">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>
            {createTemplate.isPending || updateTemplate.isPending ? 'Salvando...' : 
             template ? 'Atualizar' : 'Criar Conteúdo'}
          </Button>
        </div>
      </form>
    </Form>
  );
};