import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeSentiment } from '@/lib/brazilianStates';

export interface AdvancedFilters {
  searchTerm: string;
  sentiments: string[];
  states: string[];
  cities: string[];
  neighborhoods: string[];
  dateRange: {
    from: string;
    to: string;
  };
  tags: string[];
  status: string[];
  searchOperator: 'AND' | 'OR';
}

export const useAdvancedContactFilters = (
  filters: AdvancedFilters,
  page: number = 1,
  pageSize: number = 50
) => {
  const { organization } = useAuth();

  const contacts = useQuery({
    queryKey: ['advanced-contacts', organization?.id, JSON.stringify(filters), page, pageSize],
    queryFn: async () => {
      if (!organization?.id) return { data: [], count: 0 };

      let query = supabase
        .from('new_contact_event')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization.id);

      // Search term with AND/OR logic
      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,celular.ilike.%${filters.searchTerm}%`);
      }

      // Sentiment filters
      if (filters.sentiments.length > 0) {
        const sentimentConditions = filters.sentiments
          .map(sentiment => `sentimento.ilike.%${sentiment}%`)
          .join(',');
        query = query.or(sentimentConditions);
      }

      // Geographic filters
      if (filters.cities.length > 0) {
        query = query.in('cidade', filters.cities);
      }

      if (filters.neighborhoods.length > 0) {
        query = query.in('bairro', filters.neighborhoods);
      }

      // Date range filters
      if (filters.dateRange.from) {
        query = query.gte('created_at', filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        query = query.lte('created_at', filters.dateRange.to + 'T23:59:59.999Z');
      }

      // Status filters
      if (filters.status.length > 0) {
        const statusConditions = filters.status.map(status => {
          if (status === 'active') {
            return `status_envio.eq.enviado`;
          } else {
            return `status_envio.neq.enviado`;
          }
        }).join(',');
        query = query.or(statusConditions);
      }

      // Tag filters
      if (filters.tags.length > 0) {
        const tagConditions = filters.tags
          .map(tag => `tag.ilike.%${tag}%`)
          .join(',');
        query = query.or(tagConditions);
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const contacts = (data || []).map(contact => ({
        id: contact.id_contact_event.toString(),
        name: contact.name || 'Sem nome',
        phone: contact.celular,
        email: null,
        company: null,
        notes: contact.evento ? `Evento: ${contact.evento}` : null,
        status: (contact.status_envio === 'enviado' ? 'active' : 'active') as 'active' | 'inactive',
        organization_id: contact.organization_id,
        created_at: contact.created_at,
        updated_at: contact.updated_at || contact.created_at,
        tags: contact.tag ? contact.tag.split(', ').map((tag: string, index: number) => ({
          id: index.toString(),
          name: tag,
          color: '#6B7280'
        })) : [],
        cidade: contact.cidade,
        bairro: contact.bairro,
        sentimento: normalizeSentiment(contact.sentimento),
        evento: contact.evento,
      }));

      return { data: contacts, count: count || 0 };
    },
    enabled: !!organization?.id,
  });

  // Get available filter options
  const filterOptions = useQuery({
    queryKey: ['contact-filter-options', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { sentiments: [], cities: [], neighborhoods: [], tags: [] };

      const { data, error } = await supabase
        .from('new_contact_event')
        .select('sentimento, cidade, bairro, tag')
        .eq('organization_id', organization.id);

      if (error) throw error;

      const cidades = Array.from(new Set(data?.map(d => d.cidade).filter(Boolean))).sort();
      const bairros = Array.from(new Set(data?.map(d => d.bairro).filter(Boolean))).sort();
      const rawSentimentos = Array.from(new Set(data?.map(d => d.sentimento).filter(Boolean)));
      const sentimentos = Array.from(new Set(rawSentimentos.map(s => normalizeSentiment(s)).filter(Boolean))).sort();
      
      // Extract unique tags
      const allTags = data?.map(d => d.tag).filter(Boolean).join(', ');
      const tags = Array.from(new Set(allTags?.split(', ').filter(Boolean))).sort();

      return { sentimentos, cidades, bairros, tags };
    },
    enabled: !!organization?.id,
  });

  return {
    contacts: contacts.data?.data || [],
    contactsCount: contacts.data?.count || 0,
    contactsLoading: contacts.isLoading,
    contactsError: contacts.error,
    filterOptions: filterOptions.data || { sentiments: [], cities: [], neighborhoods: [], tags: [] },
    filterOptionsLoading: filterOptions.isLoading,
    refetch: contacts.refetch,
  };
};