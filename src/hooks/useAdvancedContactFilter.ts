import { useMemo } from 'react';
import { useContacts, Contact } from './useContacts';
import { useEvents } from './useEvents';
import { useCampaigns } from './useCampaigns';
import { useTags } from './useTags';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export interface ContactWithDetails extends Contact {
  sentiment?: string;
  eventParticipations?: string[];
  campaignParticipations?: string[];
}

export const useAdvancedContactFilter = (filters: FilterOptions) => {
  const { organization } = useAuth();
  const { contacts } = useContacts();
  const { events } = useEvents();
  const { campaigns } = useCampaigns();
  const { tags } = useTags();

  // Buscar dados de sentimento e localização dos contatos
  const { data: contactDetails } = useQuery({
    queryKey: ['contact-details', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('new_contact_event')
        .select('celular, sentimento, name')
        .eq('organization_id', organization.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Buscar participações em eventos
  const { data: eventParticipations } = useQuery({
    queryKey: ['event-participations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('event_messages')
        .select('contact_phone, event_id')
        .eq('organization_id', organization.id)
        .not('status', 'eq', 'failed');

      if (error) throw error;
      return data || [];
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
    const sentiments = Array.from(new Set(
      contactDetails?.map(c => c.sentimento).filter(Boolean) || []
    ));
    
    const cidades: string[] = [];
    const bairros: string[] = [];

    return { sentiments, cidades, bairros };
  }, [contactDetails]);

  // Contatos filtrados
  const filteredContacts = useMemo(() => {
    if (!contacts || !contactDetails) return [];

    // Criar mapa de detalhes dos contatos
    const detailsMap = new Map();
    contactDetails.forEach(detail => {
      if (detail.celular) {
        detailsMap.set(detail.celular, detail);
      }
    });

    // Criar mapa de participações em eventos
    const eventParticipationMap = new Map();
    eventParticipations?.forEach(participation => {
      const existing = eventParticipationMap.get(participation.contact_phone) || [];
      existing.push(participation.event_id);
      eventParticipationMap.set(participation.contact_phone, existing);
    });

    // Criar mapa de participações em campanhas
    const campaignParticipationMap = new Map();
    campaignParticipations?.forEach(participation => {
      const existing = campaignParticipationMap.get(participation.celular) || [];
      existing.push(participation.id_campanha);
      campaignParticipationMap.set(participation.celular, existing);
    });

    return contacts.filter(contact => {
      const details = detailsMap.get(contact.phone);
      const eventIds = eventParticipationMap.get(contact.phone) || [];
      const campaignIds = campaignParticipationMap.get(contact.phone) || [];
      const contactTagIds = contact.tags?.map(tag => tag.id) || [];

      // Filtro por sentimento
      if (filters.sentiments.length > 0) {
        const sentiment = details?.sentimento;
        if (!sentiment || !filters.sentiments.includes(sentiment)) {
          return false;
        }
      }

      // Filtro por eventos - incluir
      if (filters.includeEvents.length > 0) {
        const hasIncludedEvent = filters.includeEvents.some(eventId => 
          eventIds.includes(eventId)
        );
        if (!hasIncludedEvent) {
          return false;
        }
      }

      // Filtro por eventos - excluir (tem prioridade)
      if (filters.excludeEvents.length > 0) {
        const hasExcludedEvent = filters.excludeEvents.some(eventId => 
          eventIds.includes(eventId)
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
    }).map(contact => {
      const details = detailsMap.get(contact.phone);
      return {
        ...contact,
        sentiment: details?.sentimento,
        eventParticipations: eventParticipationMap.get(contact.phone) || [],
        campaignParticipations: campaignParticipationMap.get(contact.phone) || [],
      };
    });
  }, [contacts, contactDetails, eventParticipations, campaignParticipations, filters]);

  return {
    filteredContacts,
    filterData,
    events,
    campaigns,
    tags,
    totalContacts: contacts?.length || 0,
    filteredCount: filteredContacts.length,
  };
};