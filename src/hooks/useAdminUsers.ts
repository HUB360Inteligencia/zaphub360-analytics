import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  role?: 'saas_admin' | 'client' | 'manager' | 'agent' | 'viewer' | 'guest';
  organization_id?: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
  organization?: {
    name: string;
    slug: string;
  };
}

export const useAdminUsers = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminUser[];
    }
  });

  const updateUser = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: Partial<AdminUser>;
    }) => {
      const { error } = await supabase.from('profiles').update(data).eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    }
  });

  const sendInvite = useMutation({
    mutationFn: async (data: {
      email: string;
      organization_id: string;
      role: string;
      full_name?: string;
    }) => {
      // Enviar convite via edge function
      const { error } = await supabase.functions.invoke('send-invite', {
        body: {
          email: data.email,
          organization_id: data.organization_id,
          role: data.role,
          full_name: data.full_name
        }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Convite enviado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao enviar convite:', error);
      toast.error('Erro ao enviar convite');
    }
  });

  return {
    users,
    isLoading,
    updateUser,
    sendInvite
  };
};
