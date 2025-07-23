import React, { useState, useCallback } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MESSAGE_FORMATS, getFormatById, getRequiredContentTypes } from '@/lib/messageFormats';
import { MESSAGE_CATEGORIES, getCategoryById, validateCategoryRequirements } from '@/lib/messageCategories';

interface MessageContentFormProps {
  onSuccess: () => void;
  template?: any;
}

const messageContentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  content: z.string().optional(),
  formato_id: z.string().min(1, 'Formato é obrigatório'),
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
  onSuccess,
  template
}) => {
  const { organization } = useAuth();
  const { createTemplate, updateTemplate } = useTemplates();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [botoes, setBotoes] = useState<{ texto: string }[]>(template?.botoes || []);

  const form = useForm<z.infer<typeof messageContentSchema>>({
    resolver: zodResolver(messageContentSchema),
    defaultValues: {
      name: template?.name || '',
      category: template?.category || 'campanha-mensagens',
      content: template?.content || '',
      formato_id: template?.formato_id || '',
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
  const watchedFormatoId = form.watch('formato_id');
  const selectedFormat = getFormatById(watchedFormatoId);

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

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo baseado no formato selecionado
      if (selectedFormat) {
        const allowedTypes: Record<string, string[]> = {
          'imagem': ['image/*'],
          'audio': ['audio/*'],
          'video': ['video/*'],
          'documento': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        };

        const requiredTypes = getRequiredContentTypes(selectedFormat.id);
        const allowedFileTypes = requiredTypes.flatMap(type => allowedTypes[type] || []);
        
        if (allowedFileTypes.length > 0) {
          const isValidType = allowedFileTypes.some(type => {
            if (type.endsWith('*')) {
              return file.type.startsWith(type.slice(0, -1));
            }
            return file.type === type;
          });

          if (!isValidType) {
            toast.error('Tipo de arquivo não permitido para este formato');
            return;
          }
        }
      }

      setSelectedFile(file);
      form.setValue('media_type', file.type);
      form.setValue('media_name', file.name);
    }
  }, [selectedFormat, form]);

  const onSubmit = async (values: z.infer<typeof messageContentSchema>) => {
    if (!organization?.id) {
      toast.error('Organização não encontrada');
      return;
    }

    // Validar campos obrigatórios baseado no formato
    if (selectedFormat) {
      const errors: string[] = [];
      
      if (selectedFormat.requiredFields.includes('content') && !values.content) {
        errors.push('Conteúdo de texto é obrigatório para este formato');
      }
      if (selectedFormat.requiredFields.includes('media_url') && !selectedFile && !values.media_url) {
        errors.push('Arquivo de mídia é obrigatório para este formato');
      }
      if (selectedFormat.requiredFields.includes('latitude') && !values.latitude) {
        errors.push('Latitude é obrigatória para este formato');
      }
      if (selectedFormat.requiredFields.includes('longitude') && !values.longitude) {
        errors.push('Longitude é obrigatória para este formato');
      }
      if (selectedFormat.requiredFields.includes('botoes') && botoes.length === 0) {
        errors.push('Pelo menos um botão é obrigatório para este formato');
      }
      if (selectedFormat.requiredFields.includes('contato_nome') && !values.contato_nome) {
        errors.push('Nome do contato é obrigatório para este formato');
      }
      if (selectedFormat.requiredFields.includes('contato_numero') && !values.contato_numero) {
        errors.push('Número do contato é obrigatório para este formato');
      }
      if (selectedFormat.requiredFields.includes('mensagem_extra') && !values.mensagem_extra) {
        errors.push('Mensagem extra é obrigatória para este formato');
      }

      if (errors.length > 0) {
        errors.forEach(error => toast.error(error));
        return;
      }
    }

    try {
      setUploading(true);
      
      const templateData = {
        name: values.name,
        content: values.content || '',
        category: values.category,
        organization_id: organization.id,
        variables: extractVariables(values.content || ''),
        tipo_conteudo: selectedFormat ? getRequiredContentTypes(selectedFormat.id) : ['texto'],
        formato_id: values.formato_id,
        media_url: values.media_url,
        media_type: values.media_type,
        media_name: values.media_name,
        caption: values.caption,
        latitude: values.latitude,
        longitude: values.longitude,
        botoes: botoes.length > 0 ? botoes : undefined,
        contato_nome: values.contato_nome,
        contato_numero: values.contato_numero,
        mensagem_extra: values.mensagem_extra,
        file: selectedFile,
      };

      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, ...templateData });
      } else {
        await createTemplate.mutateAsync(templateData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar conteúdo:', error);
    } finally {
      setUploading(false);
    }
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

  const variables = extractVariables(watchedContent || '');

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
                       {MESSAGE_CATEGORIES.map(category => {
                         const IconComponent = category.icon;
                         return (
                           <SelectItem key={category.id} value={category.id}>
                             <div className="flex items-center gap-2">
                               <IconComponent className="w-4 h-4" />
                               <span>{category.name}</span>
                             </div>
                           </SelectItem>
                         );
                       })}
                     </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="formato_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o formato da mensagem" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MESSAGE_FORMATS.map((format) => {
                        const Icon = format.icon;
                        return (
                          <SelectItem key={format.id} value={format.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{format.id} - {format.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedFormat && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{selectedFormat.name}:</strong> {selectedFormat.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campos Dinâmicos baseados no Formato */}
        {selectedFormat && (
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo da Mensagem</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="editor" className="w-full">
                <TabsList>
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="space-y-4">
                  {/* Campo de texto (se necessário) */}
                  {selectedFormat.requiredFields.includes('content') && (
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
                  )}

                  {/* Upload de arquivo de mídia */}
                  {selectedFormat.requiredFields.includes('media_url') && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Upload de Mídia *</h4>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                {selectedFile ? selectedFile.name : 'Clique para fazer upload ou arraste o arquivo aqui'}
                              </span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                onChange={handleFileSelect}
                                accept={selectedFormat.name.includes('Imagem') ? 'image/*' : 
                                       selectedFormat.name.includes('Áudio') ? 'audio/*' :
                                       selectedFormat.name.includes('Vídeo') ? 'video/*' : '*/*'}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="caption"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legenda/Descrição</FormLabel>
                            <FormControl>
                              <Input placeholder="Legenda para a mídia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Localização */}
                  {(selectedFormat.requiredFields.includes('latitude') && selectedFormat.requiredFields.includes('longitude')) && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Localização *</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="latitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Latitude *</FormLabel>
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
                              <FormLabel>Longitude *</FormLabel>
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
                  )}

                  {/* Botões */}
                  {selectedFormat.requiredFields.includes('botoes') && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Botões Interativos *</h4>
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
                  )}

                  {/* Contato */}
                  {(selectedFormat.requiredFields.includes('contato_nome') || selectedFormat.requiredFields.includes('contato_numero')) && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Informações de Contato *</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contato_nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Contato *</FormLabel>
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
                              <FormLabel>Número do Contato *</FormLabel>
                              <FormControl>
                                <Input placeholder="+5541999999999" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Mensagem Extra */}
                  {selectedFormat.requiredFields.includes('mensagem_extra') && (
                    <div className="space-y-4 border-t pt-4">
                      <FormField
                        control={form.control}
                        name="mensagem_extra"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mensagem Adicional *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Texto adicional da mensagem"
                                className="min-h-24"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="preview" className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Preview da Mensagem</h4>
                    {watchedContent && (
                      <p className="whitespace-pre-wrap">{generatePreview(watchedContent, variables)}</p>
                    )}
                    {selectedFile && (
                      <div className="mt-2 text-sm text-blue-600">
                        📎 Arquivo: {selectedFile.name}
                      </div>
                    )}
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
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-2">
          <Button 
            type="submit" 
            disabled={createTemplate.isPending || updateTemplate.isPending || uploading}
          >
            {(createTemplate.isPending || updateTemplate.isPending || uploading) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {uploading ? 'Fazendo upload...' : 
             createTemplate.isPending || updateTemplate.isPending ? 'Salvando...' : 
             template ? 'Atualizar' : 'Criar Conteúdo'}
          </Button>
        </div>
      </form>
    </Form>
  );
};