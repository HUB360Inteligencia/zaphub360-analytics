
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Template {
  id: string;
  name: string;
  content: string;
  category?: string;
  variables?: string[];
  usage_count?: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
  template_tags?: { tag: string }[];
}

export const useTemplates = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['templates', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('message_templates')
        .select(`
          *,
          template_tags (tag)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: Omit<Template, 'id' | 'created_at' | 'updated_at' | 'template_tags'>) => {
      const { data, error } = await supabase
        .from('message_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Template> & { id: string }) => {
      const { data, error } = await supabase
        .from('message_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
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
      toast.success('Template excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: templatesQuery.refetch,
  };
};
