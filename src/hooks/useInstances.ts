
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Instance {
  id: string;
  name: string;
  phone_number: string;
  status: 'active' | 'inactive' | 'blocked';
  organization_id: string;
  api_url?: string;
  api_key?: string;
  created_at: string;
  updated_at: string;
}

export const useInstances = () => {
  const { organization } = useAuth();

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
  });

  // Buscar apenas instâncias ativas
  const activeInstancesQuery = useQuery({
    queryKey: ['active-instances', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  return {
    instances: instancesQuery.data || [],
    activeInstances: activeInstancesQuery.data || [],
    isLoading: instancesQuery.isLoading || activeInstancesQuery.isLoading,
    error: instancesQuery.error || activeInstancesQuery.error,
    refetch: instancesQuery.refetch,
  };
};
