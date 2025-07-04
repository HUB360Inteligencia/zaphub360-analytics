
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useErrorHandler } from './useErrorHandler';

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
  const { handleError, validateRequired } = useErrorHandler();

  const campaignsQuery = useQuery({
    queryKey: ['campaigns', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.warn('No organization ID available for campaigns query');
        return [];
      }
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
      }
      
      // Validate and sanitize data
      const validCampaigns = (data || []).map(campaign => ({
        ...campaign,
        metrics: campaign.metrics || { sent: 0, delivered: 0, read: 0, failed: 0 },
        target_contacts: campaign.target_contacts || { segments: [] },
        status: campaign.status || 'draft'
      }));
      
      return validCampaigns;
    },
    enabled: !!organization?.id,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createCampaign = useMutation({
    mutationFn: async (campaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
      // Validate required fields
      if (!validateRequired(campaignData, ['name', 'organization_id'])) {
        throw new Error('Campos obrigatórios não preenchidos');
      }

      // Sanitize data
      const sanitizedData = {
        ...campaignData,
        name: campaignData.name.trim(),
        description: campaignData.description?.trim() || null,
        metrics: campaignData.metrics || { sent: 0, delivered: 0, read: 0, failed: 0 },
        target_contacts: campaignData.target_contacts || { segments: [] },
        status: campaignData.status || 'draft'
      };

      const { data, error } = await supabase
        .from('campaigns')
        .insert(sanitizedData)
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
      handleError(error, 'Criar campanha');
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
