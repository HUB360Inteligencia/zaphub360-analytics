
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Tag {
  id: string;
  name: string;
  color: string;
  organization_id: string;
  created_at: string;
}

export const useTags = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ['tags', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const createTag = useMutation({
    mutationFn: async (tagData: Omit<Tag, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('tags')
        .insert(tagData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar tag:', error);
      toast.error('Erro ao criar tag');
    },
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Tag> & { id: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar tag:', error);
      toast.error('Erro ao atualizar tag');
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir tag:', error);
      toast.error('Erro ao excluir tag');
    },
  });

  return {
    tags: tagsQuery.data || [],
    isLoading: tagsQuery.isLoading,
    error: tagsQuery.error,
    createTag,
    updateTag,
    deleteTag,
    refetch: tagsQuery.refetch,
  };
};
