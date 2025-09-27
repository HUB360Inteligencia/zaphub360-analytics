import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeSentiment, BRAZILIAN_STATES } from '@/lib/brazilianStates';

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

      // Apply search term filter
      if (filters.searchTerm) {
        if (filters.searchOperator === 'AND') {
          const searchTerms = filters.searchTerm.split(' ').filter(term => term.trim());
          searchTerms.forEach(term => {
            query = query.or(`name.ilike.%${term}%,celular.ilike.%${term}%`);
          });
        } else {
          query = query.or(`name.ilike.%${filters.searchTerm}%,celular.ilike.%${filters.searchTerm}%`);
        }
      }

      // Apply sentiment filters with proper normalization and AND logic
      if (filters.sentiments.length > 0) {
        const sentimentConditions = filters.sentiments.map(sentiment => {
          const normalizedSentiment = sentiment.toLowerCase();
          if (normalizedSentiment === 'super engajado') {
            return `sentimento.ilike.%engajado%`;
          }
          return `sentimento.ilike.%${normalizedSentiment}%`;
        }).join(',');
        
        if (sentimentConditions) {
          query = query.or(sentimentConditions);
        }
      }

      // Apply state filters (convert to cities for filtering)
      if (filters.states.length > 0) {
        const stateCities = filters.states.flatMap(state => {
          const stateData = BRAZILIAN_STATES.find(s => s.code === state);
          return stateData?.cities || [];
        });
        
        if (stateCities.length > 0) {
          query = query.in('cidade', stateCities);
        }
      }

      // Apply city filters (further restrict if specific cities selected)
      if (filters.cities.length > 0) {
        query = query.in('cidade', filters.cities);
      }

      // Apply neighborhood filters
      if (filters.neighborhoods.length > 0) {
        query = query.in('bairro', filters.neighborhoods);
      }

      // Apply date range filters
      if (filters.dateRange.from) {
        query = query.gte('created_at', filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        query = query.lte('created_at', filters.dateRange.to + 'T23:59:59.999Z');
      }

      // Apply status filters
      if (filters.status.length > 0) {
        const statusConditions = filters.status.map(status => {
          if (status === 'active') {
            return `status_envio.eq.enviado`;
          } else {
            return `status_envio.neq.enviado`;
          }
        }).join(',');
        if (statusConditions) {
          query = query.or(statusConditions);
        }
      }

      // Apply tag filters
      if (filters.tags.length > 0) {
        const tagConditions = filters.tags
          .map(tag => `tag.ilike.%${tag}%`)
          .join(',');
        if (tagConditions) {
          query = query.or(tagConditions);
        }
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

  // Get available filter options with counts
  const filterOptions = useQuery({
    queryKey: ['contact-filter-options', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { 
        sentiments: [], 
        states: [], 
        cities: [], 
        neighborhoods: [], 
        tags: [],
        citiesByState: {},
        neighborhoodsByCity: {}
      };

      const { data, error } = await supabase
        .from('new_contact_event')
        .select('sentimento, cidade, bairro, tag')
        .eq('organization_id', organization.id);

      if (error) throw error;

      // Process cities and create state mapping
      const cidadesSet = new Set(data?.map(d => d.cidade).filter(Boolean));
      const cidades = Array.from(cidadesSet).sort();
      
      // Map cities to states
      const citiesByState: Record<string, string[]> = {};
      const availableStates: string[] = [];
      
      // First, get all available cities and map them to states
      BRAZILIAN_STATES.forEach(state => {
        const stateCities = cidades.filter(city => 
          state.cities && state.cities.includes(city)
        );
        if (stateCities.length > 0) {
          citiesByState[state.code] = stateCities;
          availableStates.push(state.code);
        }
      });

      // Also include any cities not found in our predefined states
      const unmappedCities = cidades.filter(city => 
        !BRAZILIAN_STATES.some(state => state.cities && state.cities.includes(city))
      );
      
      if (unmappedCities.length > 0) {
        // Add a generic "Outros" state for unmapped cities
        citiesByState['OUTROS'] = unmappedCities;
        availableStates.push('OUTROS');
      }

      // Process neighborhoods and create city mapping
      const bairrosSet = new Set(data?.map(d => d.bairro).filter(Boolean));
      const bairros = Array.from(bairrosSet).sort();
      
      const neighborhoodsByCity: Record<string, string[]> = {};
      cidades.forEach(city => {
        const cityNeighborhoods = data
          ?.filter(d => d.cidade === city && d.bairro)
          .map(d => d.bairro)
          .filter(Boolean);
        
        if (cityNeighborhoods && cityNeighborhoods.length > 0) {
          neighborhoodsByCity[city] = Array.from(new Set(cityNeighborhoods)).sort();
        }
      });

      // Process sentiments - normalize and get unique values
      const rawSentimentos = Array.from(new Set(data?.map(d => d.sentimento).filter(Boolean)));
      const sentimentos = Array.from(new Set(rawSentimentos.map(s => normalizeSentiment(s)).filter(Boolean))).sort();
      
      // Process tags
      const allTags = data?.map(d => d.tag).filter(Boolean).join(', ');
      const tags = Array.from(new Set(allTags?.split(', ').filter(Boolean))).sort();

      return { 
        sentimentos, 
        states: availableStates,
        cidades, 
        bairros, 
        tags,
        citiesByState,
        neighborhoodsByCity
      };
    },
    enabled: !!organization?.id,
  });

  return {
    contacts: contacts.data?.data || [],
    contactsCount: contacts.data?.count || 0,
    contactsLoading: contacts.isLoading,
    contactsError: contacts.error,
    filterOptions: filterOptions.data || { 
      sentiments: [], 
      states: [], 
      cities: [], 
      neighborhoods: [], 
      tags: [],
      citiesByState: {},
      neighborhoodsByCity: {}
    },
    filterOptionsLoading: filterOptions.isLoading,
    refetch: contacts.refetch,
  };
};