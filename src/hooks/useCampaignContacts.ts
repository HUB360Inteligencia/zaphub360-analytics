import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type CampaignContactRow = {
  id: string;
  nome_contato: string | null;
  celular: string | null;
  status: string | null;
  sentimento: string | null;
  perfil_contato: string | null;
};

export type CampaignContactsSortBy = 'nome_contato' | 'status' | 'sentimento' | 'perfil_contato';
export type CampaignContactsSortDirection = 'asc' | 'desc';

export interface CampaignContactsParams {
  campaignId?: string;
  page: number; // 1-based
  pageSize: number;
  search?: string;
  statuses?: string[]; // multiselect
  sortBy?: CampaignContactsSortBy;
  sortDirection?: CampaignContactsSortDirection;
}

export const useCampaignContacts = (params: CampaignContactsParams) => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const {
    campaignId,
    page,
    pageSize,
    search,
    statuses,
    sortBy = 'nome_contato',
    sortDirection = 'asc',
  } = params;

  const buildQuery = () => {
    // Para ordenação por status, usar a função RPC customizada
    if (sortBy === 'status') {
      return supabase.rpc('get_campaign_contacts_ordered', {
        p_campaign_id: campaignId || '',
        p_organization_id: organization?.id || '',
        p_search: search && search.trim().length > 0 ? search.trim() : null,
        p_statuses: statuses && statuses.length > 0 ? statuses : null,
        p_sort_by: sortBy,
        p_sort_direction: sortDirection,
        p_page_size: pageSize,
        p_offset: (page - 1) * pageSize
      });
    }

    // Para outros campos, usar a query padrão
    let query = supabase
      .from('mensagens_enviadas')
      .select('id, nome_contato, celular, status, sentimento, perfil_contato', { count: 'exact' })
      .eq('id_campanha', campaignId || '');

    if (organization?.id) {
      query = query.eq('organization_id', organization.id);
    }

    if (search && search.trim().length > 0) {
      const s = search.trim();
      const numeric = /^\d+$/.test(s);
      // Nome parcial (ilike) + Telefone exato
      if (numeric) {
        query = query.or(`celular.eq.${s},nome_contato.ilike.%${s}%`);
      } else {
        query = query.ilike('nome_contato', `%${s}%`);
      }
    }

    if (statuses && statuses.length > 0) {
      query = query.in('status', statuses);
    }

    query = query.order(sortBy, { ascending: sortDirection === 'asc' });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    return query;
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['campaign-contacts', campaignId, page, pageSize, search, statuses, sortBy, sortDirection],
    queryFn: async () => {
      const query = buildQuery();
      
      // Para ordenação por status (usando RPC), processar diferentemente
      if (sortBy === 'status') {
        const { data: rpcData, error } = await query;
        if (error) throw error;
        
        // A função RPC retorna os dados diretamente com total_count
        const rows = rpcData || [];
        const total = rows.length > 0 ? rows[0].total_count : 0;
        
        return {
          rows: rows.map(row => ({
            id: row.id,
            nome_contato: row.nome_contato,
            celular: row.celular,
            status: row.status,
            sentimento: row.sentimento,
            perfil_contato: row.perfil_contato,
          })),
          total: Number(total),
        };
      }
      
      // Para outros campos, usar a query padrão
      const { data: standardData, error, count } = await query;
      if (error) throw error;
      
      return {
        rows: standardData || [],
        total: count || 0,
      };
    },
    enabled: !!campaignId && !!organization?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('mensagens_enviadas')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar status')
  });

  const updateSentiment = useMutation({
    mutationFn: async ({ id, sentimento }: { id: string; sentimento: string | null }) => {
      const { error } = await supabase
        .from('mensagens_enviadas')
        .update({ sentimento })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts'] });
      toast.success('Sentimento atualizado com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar sentimento')
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mensagens_enviadas')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts'] });
      toast.success('Contato excluído com sucesso!');
    },
    onError: () => toast.error('Erro ao excluir contato')
  });

  return {
    rows: data?.rows || [],
    total: data?.total || 0,
    isLoading,
    error,
    updateStatus,
    updateSentiment,
    deleteContact,
  };
};