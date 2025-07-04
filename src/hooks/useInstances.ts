import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useErrorHandler } from './useErrorHandler';

export interface Instance {
  id: string;
  name: string;
  phone_number: string;
  api_key?: string;
  api_url?: string;
  status: 'active' | 'inactive' | 'error';
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export const useInstances = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const { handleError, validateRequired } = useErrorHandler();

  const instancesQuery = useQuery({
    queryKey: ['instances', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.warn('No organization ID available for instances query');
        return [];
      }
      
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching instances:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organization?.id,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createInstance = useMutation({
    mutationFn: async (instanceData: Omit<Instance, 'id' | 'created_at' | 'updated_at'>) => {
      if (!validateRequired(instanceData, ['name', 'phone_number', 'organization_id'])) {
        throw new Error('Campos obrigatórios não preenchidos');
      }

      const sanitizedData = {
        ...instanceData,
        name: instanceData.name.trim(),
        phone_number: instanceData.phone_number.trim(),
        api_key: instanceData.api_key?.trim() || null,
        api_url: instanceData.api_url?.trim() || null,
        status: instanceData.status || 'inactive'
      };

      const { data, error } = await supabase
        .from('instances')
        .insert(sanitizedData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      toast.success('Instância criada com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'Criar instância');
    },
  });

  const updateInstance = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Instance> & { id: string }) => {
      const { data, error } = await supabase
        .from('instances')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      toast.success('Instância atualizada com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'Atualizar instância');
    },
  });

  const deleteInstance = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('instances')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      toast.success('Instância excluída com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'Excluir instância');
    },
  });

  return {
    instances: instancesQuery.data || [],
    isLoading: instancesQuery.isLoading,
    error: instancesQuery.error,
    createInstance,
    updateInstance,
    deleteInstance,
    refetch: instancesQuery.refetch,
  };
};