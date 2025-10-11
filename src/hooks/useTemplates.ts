import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorHandler } from './useErrorHandler';
import { toast } from 'sonner';
import { generateFileName } from '@/lib/messageFormats';

export interface Template {
  id: string;
  name: string;
  content: string;
  category?: string;
  organization_id: string;
  variables?: string[];
  usage_count?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  time_delay?: number;
  event_id?: string;
  template_tags?: { tag: string }[];
  // Novos campos para EVO API
  tipo_conteudo?: string[];
  media_url?: string;
  media_type?: string;
  media_name?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  botoes?: { texto: string }[];
  contato_nome?: string;
  contato_numero?: string;
  mensagem_extra?: string;
  formato_id?: string;
}

export const useTemplates = () => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  const templatesQuery = useQuery({
    queryKey: ['templates', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.warn('No organization ID available for templates query');
        return [];
      }
      
      const { data, error } = await supabase
        .from('message_templates')
        .select(`
          *,
          template_tags (tag)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }
      
      // Validate and sanitize data
      const validTemplates = (data || []).map(template => ({
        ...template,
        variables: template.variables || [],
        usage_count: template.usage_count || 0,
        category: template.category || 'Vendas',
        template_tags: template.template_tags || [],
        tipo_conteudo: template.tipo_conteudo || ['texto'],
        botoes: Array.isArray(template.botoes) ? template.botoes : null
      })) as Template[];
      
      return validTemplates;
    },
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Função para upload de arquivo
  const uploadFile = async (file: File, templateName: string): Promise<{ url: string; type: string; name: string }> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const fileName = generateFileName(templateName, fileExtension);
    
    const { data, error } = await supabase.storage
      .from('message-content-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('message-content-media')
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      type: file.type,
      name: fileName
    };
  };

  const createTemplate = useMutation({
    mutationFn: async (templateData: Omit<Template, 'id' | 'created_at' | 'updated_at' | 'template_tags'> & { file?: File }) => {
      if (!templateData.name || !templateData.content) {
        throw new Error('Nome e conteúdo são obrigatórios');
      }

      let uploadedMedia = null;
      
      // Se há um arquivo para upload, fazer o upload primeiro
      if (templateData.file) {
        uploadedMedia = await uploadFile(templateData.file, templateData.name);
      }

      // Sanitizar dados antes de enviar
      const sanitizedData = {
        name: templateData.name.trim(),
        content: templateData.content.trim(),
        category: templateData.category || 'Vendas',
        organization_id: templateData.organization_id,
        variables: templateData.variables || [],
        created_by: user?.id,
        tipo_conteudo: templateData.tipo_conteudo || ['texto'],
        media_url: uploadedMedia?.url || templateData.media_url || null,
        media_type: uploadedMedia?.type || templateData.media_type || null,
        media_name: uploadedMedia?.name || templateData.media_name || null,
        caption: templateData.caption || null,
        latitude: templateData.latitude || null,
        longitude: templateData.longitude || null,
        botoes: templateData.botoes || null,
        contato_nome: templateData.contato_nome || null,
        contato_numero: templateData.contato_numero || null,
        mensagem_extra: templateData.mensagem_extra || null,
        formato_id: templateData.formato_id || null,
      };

      const { data, error } = await supabase
        .from('message_templates')
        .insert([sanitizedData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar template:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Conteúdo criado com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'Criar conteúdo');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, file, ...templateData }: Partial<Template> & { id: string; file?: File }) => {
      let uploadedMedia = null;
      
      // Se há um arquivo para upload, fazer o upload primeiro
      if (file) {
        uploadedMedia = await uploadFile(file, templateData.name || 'template');
      }

      const updateData = {
        ...templateData,
        ...(uploadedMedia && {
          media_url: uploadedMedia.url,
          media_type: uploadedMedia.type,
          media_name: uploadedMedia.name,
        })
      };

      const { data, error } = await supabase
        .from('message_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar template:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Conteúdo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar conteúdo');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Conteúdo excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir conteúdo');
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    uploadFile,
    refetch: templatesQuery.refetch,
  };
};