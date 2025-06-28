
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  organization_id: string;
  template_id?: string;
  target_contacts?: any;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  metrics?: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  created_at: string;
  updated_at: string;
}

export const useCampaigns = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const campaignsQuery = useQuery({
    queryKey: ['campaigns', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar campanha:', error);
      toast.error('Erro ao criar campanha');
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar campanha:', error);
      toast.error('Erro ao atualizar campanha');
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir campanha:', error);
      toast.error('Erro ao excluir campanha');
    },
  });

  return {
    campaigns: campaignsQuery.data || [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    refetch: campaignsQuery.refetch,
  };
};
