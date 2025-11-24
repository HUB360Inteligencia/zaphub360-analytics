import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  max_contacts?: number;
  max_events?: number;
  max_messages_per_month?: number;
  max_instances?: number;
  max_users?: number;
  max_storage_mb?: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAdminPlans = () => {
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    }
  });

  const createPlan = useMutation({
    mutationFn: async (data: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('subscription_plans').insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plano criado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar plano:', error);
      toast.error('Erro ao criar plano');
    }
  });

  const updatePlan = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: Partial<SubscriptionPlan>;
    }) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plano atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar plano:', error);
      toast.error('Erro ao atualizar plano');
    }
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plano excluído com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao excluir plano:', error);
      toast.error('Erro ao excluir plano');
    }
  });

  return {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan
  };
};
