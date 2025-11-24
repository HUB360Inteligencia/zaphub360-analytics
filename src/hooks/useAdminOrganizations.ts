import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  is_active: boolean;
  plan_id?: string;
  plan_started_at?: string;
  plan_expires_at?: string;
  usage_stats: any;
  created_at: string;
  updated_at: string;
  plan?: {
    name: string;
    display_name: string;
    max_contacts?: number;
    max_events?: number;
    max_messages_per_month?: number;
    max_instances?: number;
    max_users?: number;
  };
}

export const useAdminOrganizations = () => {
  const queryClient = useQueryClient();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          plan:subscription_plans(
            name,
            display_name,
            max_contacts,
            max_events,
            max_messages_per_month,
            max_instances,
            max_users
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Organization[];
    }
  });

  const createOrganization = useMutation({
    mutationFn: async (data: {
      name: string;
      slug: string;
      domain?: string;
      plan_id: string;
      is_active: boolean;
      plan_expires_at?: string;
    }) => {
      const { error } = await supabase.from('organizations').insert({
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        plan_id: data.plan_id,
        is_active: data.is_active,
        plan_started_at: new Date().toISOString(),
        plan_expires_at: data.plan_expires_at
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Organização criada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar organização:', error);
      toast.error('Erro ao criar organização');
    }
  });

  const updateOrganization = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: Partial<Organization>;
    }) => {
      const { error } = await supabase
        .from('organizations')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Organização atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar organização:', error);
      toast.error('Erro ao atualizar organização');
    }
  });

  const deleteOrganization = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('organizations').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Organização excluída com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao excluir organização:', error);
      toast.error('Erro ao excluir organização');
    }
  });

  const changePlan = useMutation({
    mutationFn: async ({
      organizationId,
      planId,
      expiresAt
    }: {
      organizationId: string;
      planId: string;
      expiresAt?: string;
    }) => {
      const { error } = await supabase
        .from('organizations')
        .update({
          plan_id: planId,
          plan_started_at: new Date().toISOString(),
          plan_expires_at: expiresAt
        })
        .eq('id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Plano alterado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao alterar plano:', error);
      toast.error('Erro ao alterar plano');
    }
  });

  return {
    organizations,
    isLoading,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    changePlan
  };
};
