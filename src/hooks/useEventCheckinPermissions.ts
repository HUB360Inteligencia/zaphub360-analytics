import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useEventCheckinPermissions = (eventId: string) => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch organization users
  const usersQuery = useQuery({
    queryKey: ['organization-users', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!user_roles_user_id_fkey (
            role
          )
        `)
        .eq('organization_id', organization.id)
        .order('full_name');

      if (error) throw error;
      return data || [];
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
