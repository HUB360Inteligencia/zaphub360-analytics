import { useMemo } from 'react';
import { useEvents } from './useEvents';
import { useCampaigns } from './useCampaigns';
import { useTags } from './useTags';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeSentiment } from '@/lib/sentiment';

export interface FilterOptions {
  sentiments: string[];
  cidades: string[];
  bairros: string[];
  includeEvents: string[];
  excludeEvents: string[];
  includeCampaigns: string[];
  excludeCampaigns: string[];
  includeTags: string[];
  excludeTags: string[];
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
  ultima_instancia?: string;
  evento?: string; // Campo evento da tabela
  campaignParticipations?: string[];
  tags?: Array<{ id: string; name: string; color: string }>;
}

export const useAdvancedContactFilter = (filters: FilterOptions) => {
  const { organization } = useAuth();
  const { events } = useEvents();
  const { campaigns } = useCampaigns();
  const { tags } = useTags();

  // Buscar TODOS os contatos diretamente de new_contact_event (SEM LIMITE - todos os 6175+)
  const { data: allContacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['all-contacts-new-contact-event', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('new_contact_event')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear para o formato esperado, incluindo a coluna evento
      return (data || []).map(contact => ({
        id: contact.id_contact_event?.toString() || contact.celular || '',
        name: contact.name || 'Sem nome',
        phone: contact.celular || '',
        email: '',
        status: contact.status_envio || 'active',
        sentiment: normalizeSentiment(contact.sentimento),
        cidade: contact.cidade,
        bairro: contact.bairro,
        ultima_instancia: contact.ultima_instancia,
        evento: contact.evento, // Adicionar campo evento
        tags: []
      }));
    },
    enabled: !!organization?.id,
  });

  // Buscar eventos únicos diretamente da coluna 'evento' em new_contact_event
  const { data: uniqueEvents } = useQuery({
    queryKey: ['unique-events-from-evento', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('new_contact_event')
        .select('evento')
        .eq('organization_id', organization.id)
        .not('evento', 'is', null);

      if (error) throw error;
      
      // Extrair eventos únicos (muitos contatos têm múltiplos eventos separados por vírgulas/pontos)
      const eventSet = new Set<string>();
      (data || []).forEach(item => {
        if (item.evento) {
          // Split por vírgulas, pontos seguidos de espaço, ou " . "
          const eventNames = item.evento
            .split(/[,.]/)
            .map(e => e.trim())
            .filter(e => e.length > 0);
          eventNames.forEach(name => eventSet.add(name));
        }
      });
      
      return Array.from(eventSet)
        .sort()
        .map((name, index) => ({ 
          id: name, // Usar o nome como ID para facilitar filtro
          name 
        }));
    },
    enabled: !!organization?.id,
  });

  // Buscar participações em campanhas
  const { data: campaignParticipations } = useQuery({
    queryKey: ['campaign-participations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('mensagens_enviadas')
        .select('celular, id_campanha')
        .eq('organization_id', organization.id)
        .not('status', 'eq', 'failed');

      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Dados únicos para os filtros
  const filterData = useMemo(() => {
    if (!allContacts) return { sentiments: [], cidades: [], bairros: [] };
    
    // Normalizar e ordenar sentimentos
    const sentimentsSet = new Set<string>();
    allContacts.forEach(contact => {
      if (contact.sentiment) {
        sentimentsSet.add(contact.sentiment);
      }
    });
    
    // Ordem específica dos sentimentos
    const sentimentOrder = ['Negativo', 'Neutro', 'Positivo', 'Super engajado'];
    const sentiments = sentimentOrder.filter(s => sentimentsSet.has(s));
    
    // Cidades únicas e ordenadas
    const cidadesSet = new Set<string>();
    allContacts.forEach(contact => {
      if (contact.cidade) {
        cidadesSet.add(contact.cidade);
      }
    });
    const cidades = Array.from(cidadesSet).sort();
    
    // Bairros únicos e ordenados
    const bairrosSet = new Set<string>();
    allContacts.forEach(contact => {
      if (contact.bairro) {
        bairrosSet.add(contact.bairro);
      }
    });
    const bairros = Array.from(bairrosSet).sort();

    return { sentiments, cidades, bairros };
  }, [allContacts]);

  // Contatos filtrados
  const filteredContacts = useMemo(() => {
    if (!allContacts) return [];

    // Criar mapa de participações em campanhas
    const campaignParticipationMap = new Map();
    campaignParticipations?.forEach(participation => {
      const existing = campaignParticipationMap.get(participation.celular) || [];
      existing.push(participation.id_campanha);
      campaignParticipationMap.set(participation.celular, existing);
    });

    return allContacts.filter(contact => {
      const campaignIds = campaignParticipationMap.get(contact.phone) || [];
      const contactTagIds = contact.tags?.map(tag => tag.id) || [];

      // Filtro por sentimento
      if (filters.sentiments.length > 0) {
        if (!contact.sentiment || !filters.sentiments.includes(contact.sentiment)) {
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

      // Filtro por eventos - CORRIGIDO para usar coluna 'evento'
      if (filters.includeEvents.length > 0) {
        if (!contact.evento) return false;
        
        // Verificar se o campo evento contém algum dos eventos selecionados
        const hasIncludedEvent = filters.includeEvents.some(eventName => 
          contact.evento.includes(eventName)
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
          contact.evento.includes(eventName)
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
  }, [allContacts, campaignParticipations, JSON.stringify(filters)]);

  return {
    filteredContacts,
    filterData,
    events: uniqueEvents || [], // Usar eventos da coluna 'evento'
    campaigns,
    tags,
    totalContacts: allContacts?.length || 0,
    filteredCount: filteredContacts.length,
    isLoading: contactsLoading,
  };
};