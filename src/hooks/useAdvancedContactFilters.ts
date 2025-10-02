import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeSentiment } from '@/lib/brazilianStates';

export interface AdvancedFilters {
  searchTerm: string;
  sentiments: string[];
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

  // Fetch ALL contacts (no pagination limit) for filtering
  const allContactsQuery = useQuery({
    queryKey: ['all-contacts-for-filters', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      let aggregated: any[] = [];
      let pageIndex = 0;
      const batchSize = 1000;

      while (true) {
        const from = pageIndex * batchSize;
        const to = from + batchSize - 1;

        const { data: pageData, error } = await supabase
          .from('new_contact_event')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (!pageData || pageData.length === 0) break;

        aggregated = aggregated.concat(pageData || []);
        
        if (pageData.length < batchSize) break;
        pageIndex++;
      }

      // Map all contacts directly (no deduplication)
      return aggregated
        .filter(contact => contact.celular)
        .map(contact => ({
          id: contact.id_contact_event?.toString() || contact.celular || '',
          name: contact.name || 'Sem nome',
          phone: contact.celular || '',
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
          cidade: contact.cidade?.trim() || null,
          bairro: contact.bairro?.trim() || null,
          sentimento: normalizeSentiment(contact.sentimento),
          evento: contact.evento,
          sobrenome: contact.sobrenome,
        }));
    },
    enabled: !!organization?.id,
  });

  // Apply filters to all contacts
  const filteredContacts = useQuery({
    queryKey: ['filtered-contacts', organization?.id, JSON.stringify(filters), page, pageSize],
    queryFn: async () => {
      const allContacts = allContactsQuery.data || [];
      
      let filtered = allContacts;

      // Apply search term filter (incluindo sobrenome)
      if (filters.searchTerm) {
        if (filters.searchOperator === 'AND') {
          const searchTerms = filters.searchTerm.split(' ').filter(term => term.trim());
          filtered = filtered.filter(contact => 
            searchTerms.every(term => 
              contact.name.toLowerCase().includes(term.toLowerCase()) ||
              (contact as any).sobrenome?.toLowerCase().includes(term.toLowerCase()) ||
              contact.phone.toLowerCase().includes(term.toLowerCase())
            )
          );
        } else {
          filtered = filtered.filter(contact =>
            contact.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            (contact as any).sobrenome?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            contact.phone.toLowerCase().includes(filters.searchTerm.toLowerCase())
          );
        }
      }

      // Apply sentiment filters
      if (filters.sentiments.length > 0) {
        filtered = filtered.filter(contact => 
          filters.sentiments.some(sentiment => 
            contact.sentimento?.toLowerCase() === sentiment.toLowerCase()
          )
        );
      }

      // Apply city filters
      if (filters.cities.length > 0) {
        filtered = filtered.filter(contact => 
          filters.cities.includes(contact.cidade || '')
        );
      }

      // Apply neighborhood filters
      if (filters.neighborhoods.length > 0) {
        filtered = filtered.filter(contact => 
          filters.neighborhoods.includes(contact.bairro || '')
        );
      }

      // Apply date range filters
      if (filters.dateRange.from) {
        filtered = filtered.filter(contact => 
          new Date(contact.created_at) >= new Date(filters.dateRange.from)
        );
      }
      if (filters.dateRange.to) {
        filtered = filtered.filter(contact => 
          new Date(contact.created_at) <= new Date(filters.dateRange.to + 'T23:59:59.999Z')
        );
      }

      // Apply status filters
      if (filters.status.length > 0) {
        filtered = filtered.filter(contact => 
          filters.status.includes(contact.status)
        );
      }

      // Apply tag filters
      if (filters.tags.length > 0) {
        filtered = filtered.filter(contact => 
          filters.tags.some(tag => 
            contact.tags?.some(contactTag => contactTag.name.toLowerCase().includes(tag.toLowerCase()))
          )
        );
      }

      const totalCount = filtered.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = filtered.slice(from, to);

      return { data: paginatedData, count: totalCount };
    },
    enabled: !!organization?.id && !!allContactsQuery.data,
  });

  // Get available filter options
  const filterOptions = useQuery({
    queryKey: ['contact-filter-options', organization?.id],
    queryFn: async () => {
      const allContacts = allContactsQuery.data || [];

      // Process cities
      const cidadesSet = new Set(allContacts.map(c => c.cidade).filter(Boolean));
      const cidades = Array.from(cidadesSet).sort();
      
      // Process neighborhoods and create city mapping
      const bairrosSet = new Set(allContacts.map(c => c.bairro).filter(Boolean));
      const bairros = Array.from(bairrosSet).sort();
      
      const neighborhoodsByCity: Record<string, string[]> = {};
      cidades.forEach(city => {
        const cityNeighborhoods = allContacts
          .filter(c => c.cidade === city && c.bairro)
          .map(c => c.bairro)
          .filter(Boolean);
        
        if (cityNeighborhoods.length > 0) {
          neighborhoodsByCity[city] = Array.from(new Set(cityNeighborhoods)).sort();
        }
      });

      // Process sentiments - normalize and get unique values
      const sentimentos = Array.from(new Set(
        allContacts
          .map(c => c.sentimento)
          .filter(Boolean)
      )).sort();
      
      // Process tags
      const allTags = allContacts
        .flatMap(c => c.tags?.map(t => t.name) || [])
        .filter(Boolean);
      const tags = Array.from(new Set(allTags)).sort();

      return { 
        sentimentos, 
        cidades, 
        bairros, 
        tags,
        neighborhoodsByCity
      };
    },
    enabled: !!organization?.id && !!allContactsQuery.data,
  });

  return {
    contacts: filteredContacts.data?.data || [],
    contactsCount: filteredContacts.data?.count || 0,
    contactsLoading: allContactsQuery.isLoading || filteredContacts.isLoading,
    contactsError: filteredContacts.error,
    filterOptions: filterOptions.data || { 
      sentimentos: [], 
      cidades: [], 
      bairros: [], 
      tags: [],
      neighborhoodsByCity: {}
    },
    filterOptionsLoading: filterOptions.isLoading,
    refetch: filteredContacts.refetch,
  };
};
