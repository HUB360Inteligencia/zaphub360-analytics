import { useMemo } from 'react';
import { useCampaigns } from './useCampaigns';
import { useTags } from './useTags';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeSentiment, SENTIMENT_VALUES } from '@/lib/sentiment';

export interface FilterOptions {
  sentiments: string[];
  sentimentsExclude: string[];
  cidades: string[];
  bairros: string[];
  regionais: string[];
  profiles: string[];
  includeEvents: string[];
  excludeEvents: string[];
  includeCampaigns: string[];
  excludeCampaigns: string[];
  includeTags: string[];
  excludeTags: string[];
  includeGeneros: string[];
  excludeGeneros: string[];
}

export interface ContactWithDetails {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status?: string;
  sentiment?: string;
  cidade?: string;
  bairro?: string;
  regional?: string | null;
  ultima_instancia?: string;
  evento?: string; // Campo evento da tabela
  profile?: string | null;
  genero?: string; // 'F' ou 'M'
  campaignParticipations?: string[];
  tags?: Array<{ id: string; name: string; color: string }>;
}

const PAGE_SIZE = 1000;

/** Valores distintos de regional em new_contact_event e new_contact_message (para o painel de filtros). */
async function fetchDistinctRegionalsFromTables(orgId: string): Promise<string[]> {
  const set = new Set<string>();

  const ingestPage = (rows: { regional: string | null }[] | null) => {
    rows?.forEach((row) => {
      const v = (row.regional || '').trim();
      if (v) set.add(v);
    });
  };

  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('new_contact_event')
      .select('regional')
      .eq('organization_id', orgId)
      .not('regional', 'is', null)
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.warn('[AdvancedContactFilter] distinct regional (new_contact_event):', error.message);
      break;
    }
    if (!data?.length) break;
    ingestPage(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('new_contact_message')
      .select('regional')
      .eq('organization_id', orgId)
      .not('regional', 'is', null)
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.warn('[AdvancedContactFilter] distinct regional (new_contact_message):', error.message);
      break;
    }
    if (!data?.length) break;
    ingestPage(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export const useAdvancedContactFilter = (filters: FilterOptions) => {
  const { organization } = useAuth();
  const { campaigns } = useCampaigns();
  const { tags } = useTags();

  // Buscar TODOS os contatos diretamente de new_contact_event (SEM LIMITE - todos os 6175+)
  const { data: allContacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['all-contacts-new-contact-event', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const pageSize = 1000; // Limite do PostgREST por requisição
      let from = 0;
      let to = pageSize - 1;
      let aggregated: any[] = [];

      // Primeira página com count
      const { data: firstPage, count, error } = await supabase
        .from('new_contact_event')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      aggregated = [...(firstPage || [])];

      const total = count ?? aggregated.length;

      // Demais páginas
      while (aggregated.length < total) {
        from += pageSize;
        to += pageSize;
        const { data: pageData, error: pageError } = await supabase
          .from('new_contact_event')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .range(from, to);
        if (pageError) throw pageError;
        aggregated = aggregated.concat(pageData || []);
      }

      // Mapear todos os contatos diretamente (sem deduplicação)
      return aggregated
        .filter(contact => contact.celular) // Apenas garantir que tem telefone
        .map(contact => ({
          id: contact.id_contact_event?.toString() || contact.celular || '',
          name: contact.name || 'Sem nome',
          phone: contact.celular || '',
          email: '',
          status: contact.status_envio || 'active',
          sentiment: normalizeSentiment(contact.sentimento),
          cidade: contact.cidade?.trim() || null, // Normalizar cidade com trim
          bairro: contact.bairro?.trim() || null, // Normalizar bairro com trim
          regional: contact.regional?.trim() || null,
          ultima_instancia: contact.ultima_instancia,
          evento: contact.evento, // Adicionar campo evento
          profile: contact.perfil_contato || contact.perfil || null,
          genero: contact.sexo || null, // 'F' ou 'M'
          tags: []
        }));
    },
    enabled: !!organization?.id,
  });

  /** Regional vindo de new_contact_message (último registro por celular, quando possível) */
  const { data: regionalByPhone, isLoading: regionalLoading } = useQuery({
    queryKey: ['new-contact-message-regionals', organization?.id],
    queryFn: async (): Promise<Map<string, string>> => {
      if (!organization?.id) return new Map();

      const map = new Map<string, string>();
      const pageSize = 1000;
      let from = 0;

      const fetchPage = async (withCreatedOrder: boolean) => {
        let q = supabase
          .from('new_contact_message')
          .select('celular, regional')
          .eq('organization_id', organization.id)
          .not('regional', 'is', null)
          .range(from, from + pageSize - 1);
        if (withCreatedOrder) {
          q = q.order('created_at', { ascending: false });
        }
        return q;
      };

      let useOrder = true;
      for (;;) {
        const { data, error } = await fetchPage(useOrder);
        if (error) {
          if (useOrder) {
            useOrder = false;
            from = 0;
            map.clear();
            continue;
          }
          console.warn('[AdvancedContactFilter] new_contact_message (regional):', error.message);
          return new Map();
        }
        if (!data?.length) break;
        for (const row of data) {
          const phone = (row.celular || '').trim();
          const reg = (row.regional || '').trim();
          if (phone && reg && !map.has(phone)) map.set(phone, reg);
        }
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return map;
    },
    enabled: !!organization?.id,
  });

  /** Contatos com regional: prioridade new_contact_event; fallback new_contact_message por celular */
  const contactsWithRegional = useMemo(() => {
    if (!allContacts) return [];
    const fromMessages = regionalByPhone ?? new Map<string, string>();
    return allContacts.map((c) => {
      const fromEvent = c.regional?.trim() || null;
      const fromMsg = fromMessages.get(c.phone) || null;
      return {
        ...c,
        regional: fromEvent || fromMsg || null,
      };
    });
  }, [allContacts, regionalByPhone]);

  const { data: distinctRegionalsFromDb = [], isLoading: distinctRegionalsLoading } = useQuery({
    queryKey: ['distinct-regionals-tables', organization?.id],
    queryFn: () => fetchDistinctRegionalsFromTables(organization!.id),
    enabled: !!organization?.id,
  });

  // Buscar eventos únicos diretamente da coluna 'evento' em new_contact_event (sem limite)
  const { data: uniqueEvents } = useQuery({
    queryKey: ['unique-events-from-evento', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const pageSize = 1000;
      let from = 0;
      let to = pageSize - 1;
      let aggregated: any[] = [];

      const { data: firstPage, count, error } = await supabase
        .from('new_contact_event')
        .select('evento', { count: 'exact' })
        .eq('organization_id', organization.id)
        .not('evento', 'is', null)
        .range(from, to);

      if (error) throw error;
      aggregated = [...(firstPage || [])];
      const total = count ?? aggregated.length;

      while (aggregated.length < total) {
        from += pageSize;
        to += pageSize;
        const { data: pageData, error: pageError } = await supabase
          .from('new_contact_event')
          .select('evento')
          .eq('organization_id', organization.id)
          .not('evento', 'is', null)
          .range(from, to);
        if (pageError) throw pageError;
        aggregated = aggregated.concat(pageData || []);
      }

      const uniqueSet = new Set<string>();
      aggregated.forEach(item => {
        if (item.evento) {
          uniqueSet.add(item.evento);
        }
      });

      return Array.from(uniqueSet).sort().map(eventName => ({
        id: eventName,
        name: eventName,
        status: 'active'
      }));
    }
  });

  // Dados para filtros
  const filterData = useMemo(() => {
    const sentimentsSet = new Set<string>();
    contactsWithRegional.forEach(contact => {
      const normalized = normalizeSentiment(contact.sentiment);
      if (normalized) {
        sentimentsSet.add(normalized);
      }
    });
    
    // Ordem específica dos sentimentos (normalizados em minúsculo)
    const sentimentOrder = [
      SENTIMENT_VALUES.NEGATIVO,
      SENTIMENT_VALUES.NEUTRO,
      SENTIMENT_VALUES.POSITIVO,
      SENTIMENT_VALUES.SUPER_ENGAJADO
    ];
    const sentiments = sentimentOrder.filter(s => sentimentsSet.has(s));
    
    // Cidades únicas e ordenadas (normalizar para evitar duplicatas)
    const cidadesSet = new Set<string>();
    contactsWithRegional.forEach(contact => {
      if (contact.cidade) {
        const normalized = (contact.cidade || '').trim();
        if (normalized) cidadesSet.add(normalized);
      }
    });
    const cidades = Array.from(cidadesSet).sort();
    
    // Bairros únicos e ordenados (normalizar para evitar duplicatas)
    const bairrosSet = new Set<string>();
    contactsWithRegional.forEach(contact => {
      if (contact.bairro) {
        const normalized = (contact.bairro || '').trim();
        if (normalized) bairrosSet.add(normalized);
      }
    });
    const bairros = Array.from(bairrosSet).sort();

    const regionaisSet = new Set<string>();
    contactsWithRegional.forEach(contact => {
      if (contact.regional) {
        const normalized = (contact.regional || '').trim();
        if (normalized) regionaisSet.add(normalized);
      }
    });
    distinctRegionalsFromDb.forEach((r) => regionaisSet.add(r));
    const regionais = Array.from(regionaisSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    // Perfis únicos
    const perfisSet = new Set<string>();
    contactsWithRegional.forEach(contact => {
      if (contact.profile) {
        const normalized = (contact.profile || '').trim();
        if (normalized) perfisSet.add(normalized);
      }
    });
    const profiles = Array.from(perfisSet).sort();

    // Gêneros únicos ('F' ou 'M')
    const generosSet = new Set<string>();
    contactsWithRegional.forEach(contact => {
      if (contact.genero) {
        generosSet.add(contact.genero);
      }
    });
    const generos = Array.from(generosSet).sort();

    return { sentiments, cidades, bairros, regionais, profiles, generos };
  }, [contactsWithRegional, distinctRegionalsFromDb]);

  // Participações em campanhas
  const { data: campaignParticipations } = useQuery({
    queryKey: ['campaign-participations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('mensagens_enviadas')
        .select('id_campanha, celular')
        .eq('organization_id', organization.id);
      if (error) throw error;
      return data || [];
    }
  });

  // Contatos filtrados
  const filteredContacts = useMemo(() => {
    if (!contactsWithRegional.length) return [];

    // Criar mapa de participações em campanhas
    const campaignParticipationMap = new Map();
    campaignParticipations?.forEach(participation => {
      const existing = campaignParticipationMap.get(participation.celular) || [];
      existing.push(participation.id_campanha);
      campaignParticipationMap.set(participation.celular, existing);
    });

    return contactsWithRegional.filter(contact => {
      const campaignIds = campaignParticipationMap.get(contact.phone) || [];
      const contactTagIds = contact.tags?.map(tag => tag.id) || [];

      // Filtro por sentimento
      if (filters.sentiments.length > 0) {
        if (!contact.sentiment || !filters.sentiments.includes(contact.sentiment)) {
          return false;
        }
      }

      // Exclusão por sentimento
      if (filters.sentimentsExclude.length > 0) {
        if (contact.sentiment && filters.sentimentsExclude.includes(contact.sentiment)) {
          return false;
        }
      }

      // Filtro por cidade
      if (filters.cidades.length > 0) {
        if (!contact.cidade || !filters.cidades.includes(contact.cidade)) {
          return false;
        }
      }

      // Filtro por bairro
      if (filters.bairros.length > 0) {
        if (!contact.bairro || !filters.bairros.includes(contact.bairro)) {
          return false;
        }
      }

      // Filtro por regional (new_contact_event e/ou new_contact_message)
      if (filters.regionais.length > 0) {
        if (!contact.regional || !filters.regionais.includes(contact.regional)) {
          return false;
        }
      }

      // Filtro por perfil do contato
      if (filters.profiles.length > 0) {
        if (!contact.profile || !filters.profiles.includes(contact.profile)) {
          return false;
        }
      }

      // Filtro por gênero - incluir
      if (filters.includeGeneros.length > 0) {
        if (!contact.genero || !filters.includeGeneros.includes(contact.genero)) {
          return false;
        }
      }

      // Filtro por gênero - excluir
      if (filters.excludeGeneros.length > 0) {
        if (contact.genero && filters.excludeGeneros.includes(contact.genero)) {
          return false;
        }
      }

      // Filtro por eventos - CORRIGIDO para usar coluna 'evento'
      if (filters.includeEvents.length > 0) {
        if (!contact.evento) return false;
        
        // Verificar se o campo evento contém algum dos eventos selecionados
        const hasIncludedEvent = filters.includeEvents.some(eventName => 
          (contact.evento || '').includes(eventName)
        );
        if (!hasIncludedEvent) {
          return false;
        }
      }

      // Filtro por eventos - excluir (tem prioridade)
      if (filters.excludeEvents.length > 0) {
        if (!contact.evento) return true; // Se não tem evento, não precisa excluir
        
        // Verificar se o campo evento contém algum evento a ser excluído
        const hasExcludedEvent = filters.excludeEvents.some(eventName => 
          (contact.evento || '').includes(eventName)
        );
        if (hasExcludedEvent) {
          return false;
        }
      }

      // Filtro por campanhas - incluir
      if (filters.includeCampaigns.length > 0) {
        const hasIncludedCampaign = filters.includeCampaigns.some(campaignId => 
          campaignIds.includes(campaignId)
        );
        if (!hasIncludedCampaign) {
          return false;
        }
      }

      // Filtro por campanhas - excluir (tem prioridade)
      if (filters.excludeCampaigns.length > 0) {
        const hasExcludedCampaign = filters.excludeCampaigns.some(campaignId => 
          campaignIds.includes(campaignId)
        );
        if (hasExcludedCampaign) {
          return false;
        }
      }

      // Filtro por tags - incluir
      if (filters.includeTags.length > 0) {
        const hasIncludedTag = filters.includeTags.some(tagId => 
          contactTagIds.includes(tagId)
        );
        if (!hasIncludedTag) {
          return false;
        }
      }

      // Filtro por tags - excluir (tem prioridade)
      if (filters.excludeTags.length > 0) {
        const hasExcludedTag = filters.excludeTags.some(tagId => 
          contactTagIds.includes(tagId)
        );
        if (hasExcludedTag) {
          return false;
        }
      }

      return true;
    }).map(contact => ({
      ...contact,
      campaignParticipations: campaignParticipationMap.get(contact.phone) || [],
    }));
  }, [contactsWithRegional, campaignParticipations, JSON.stringify(filters)]);

  return {
    filteredContacts,
    filterData,
    events: uniqueEvents || [], // Usar eventos da coluna 'evento'
    campaigns,
    tags,
    totalContacts: contactsWithRegional.length,
    filteredCount: filteredContacts.length,
    isLoading: contactsLoading || regionalLoading || distinctRegionalsLoading,
    regionalsOptionsLoading: distinctRegionalsLoading,
  };
};