import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  user_roles: Array<{ role: UserRole }>;
}

export const useEventCheckinPermissions = (eventId: string) => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch organization users
  const usersQuery = useQuery<UserWithRoles[]>({
    queryKey: ['organization-users', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('organization_id', organization.id)
        .order('full_name');

      if (profilesError) throw profilesError;
      if (!profiles) return [];

      // Fetch user roles for these users
      const userIds = profiles.map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Merge profiles with their roles
      const usersWithRoles: UserWithRoles[] = profiles.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id).map(r => ({ role: r.role })) || []
      }));

      return usersWithRoles;
    },
    enabled: !!organization?.id,
  });

  // Fetch permissions for this event
  const permissionsQuery = useQuery({
    queryKey: ['event-checkin-permissions', eventId, organization?.id],
    queryFn: async () => {
      if (!organization?.id || !eventId) return [];

      const { data, error } = await supabase
        .from('event_checkin_permissions')
        .select(`
          *,
          profiles!event_checkin_permissions_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('event_id', eventId)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id && !!eventId,
  });

  // Grant permission
  const grantPermission = useMutation({
    mutationFn: async (userId: string) => {
      if (!organization?.id || !eventId || !user?.id) {
        throw new Error('Dados incompletos');
      }

      const { error } = await supabase
        .from('event_checkin_permissions')
        .insert({
          event_id: eventId,
          user_id: userId,
          organization_id: organization.id,
          granted_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-checkin-permissions', eventId] });
      toast.success('Permissão concedida');
    },
    onError: (error: any) => {
      console.error('Erro ao conceder permissão:', error);
      toast.error('Erro ao conceder permissão');
    },
  });

  // Revoke permission
  const revokePermission = useMutation({
    mutationFn: async (permissionId: string) => {
      const { error } = await supabase
        .from('event_checkin_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-checkin-permissions', eventId] });
      toast.success('Permissão removida');
    },
    onError: (error: any) => {
      console.error('Erro ao remover permissão:', error);
      toast.error('Erro ao remover permissão');
    },
  });

  return {
    users: usersQuery.data || [],
    isLoadingUsers: usersQuery.isLoading,
    permissions: permissionsQuery.data || [],
    isLoadingPermissions: permissionsQuery.isLoading,
    grantPermission,
    revokePermission,
  };
};
