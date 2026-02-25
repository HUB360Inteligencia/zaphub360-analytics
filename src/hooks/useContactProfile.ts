
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContactEvent {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  status: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  message_content: string;
  status: string;
  sentiment: string | null;
  sent_at: string | null;
  read_at: string | null;
  responded_at: string | null;
  event_name: string;
  created_at: string;
  direction?: 'sent' | 'received';
}

export interface ContactProfileData {
  contact: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    avatar_url?: string;
    company?: string;
    created_at: string;
  } | null;
  fullName: string | null;
  events: ContactEvent[];
  messages: ContactMessage[];
  stats: {
    totalEvents: number;
    totalMessages: number;
    readMessages: number;
    respondedMessages: number;
    sentimentCounts: {
      superEngajado: number;
      positivo: number;
      neutro: number;
      negativo: number;
      semClassificacao: number;
    };
  };
}

export const useContactProfile = (contactPhone: string) => {
  const { organization } = useAuth();

  const profileQuery = useQuery({
    queryKey: ['contact-profile', contactPhone, organization?.id],
    queryFn: async (): Promise<ContactProfileData> => {
      if (!organization?.id || !contactPhone) {
        return {
          contact: null,
          fullName: null,
          events: [],
          messages: [],
          stats: {
            totalEvents: 0,
            totalMessages: 0,
            readMessages: 0,
            respondedMessages: 0,
            sentimentCounts: {
              superEngajado: 0,
              positivo: 0,
              neutro: 0,
              negativo: 0,
              semClassificacao: 0,
            },
          },
        };
      }

      // Buscar contato na tabela new_contact_event
      const { data: contactData } = await supabase
        .from('new_contact_event')
        .select('id_contact_event, name, sobrenome, celular, cidade, bairro, created_at')
        .eq('celular', contactPhone)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const contact = contactData ? {
        id: contactData.id_contact_event.toString(),
        name: `${contactData.name || ''} ${contactData.sobrenome || ''}`.trim() || 'Sem nome',
        phone: contactData.celular,
        email: null, // new_contact_event não tem email
        avatar_url: null, // new_contact_event não tem avatar
        company: null, // new_contact_event não tem empresa  
        created_at: contactData.created_at,
      } : null;

      // Buscar mensagens no mensagens_enviadas para obter nome completo e dados completos
      const { data: mensagensEnviadas } = await supabase
        .from('mensagens_enviadas')
        .select('nome_contato, sobrenome_contato, status, sentimento, data_envio, data_leitura, data_resposta, mensagem, resposta_usuario')
        .eq('celular', contactPhone)
        .eq('organization_id', organization.id)
        .order('data_envio', { ascending: false });

      // Obter nome completo das mensagens enviadas
      const fullName = mensagensEnviadas?.[0] ? 
        `${(mensagensEnviadas[0] as any).nome_contato || ''} ${(mensagensEnviadas[0] as any).sobrenome_contato || ''}`.trim() || null 
        : null;

      // Buscar eventos únicos onde o contato participou
      const { data: eventMessages } = await supabase
        .from('event_messages')
        .select(`
          event_id,
          events!inner(id, name, event_date, location, status, created_at)
        `)
        .eq('contact_phone', contactPhone)
        .eq('organization_id', organization.id);

      // Remover eventos duplicados
      const uniqueEvents: ContactEvent[] = [];
      const eventIds = new Set();
      
      eventMessages?.forEach(item => {
        if (!eventIds.has(item.event_id)) {
          eventIds.add(item.event_id);
          uniqueEvents.push({
            id: item.events.id,
            name: item.events.name,
            event_date: item.events.event_date,
            location: item.events.location,
            status: item.events.status,
            created_at: item.events.created_at,
          });
        }
      });

      // Histórico de mensagens: apenas contact_messages (fonte única, sem duplicatas)
      const { data: contactMessages, error: cmError } = await supabase
        .from('contact_messages')
        .select('id, mensagem, sentiment, direction, data_mensagem')
        .eq('celular', contactPhone)
        .eq('organization_id', organization.id)
        .order('data_mensagem', { ascending: false });

      if (cmError) {
        console.error('Error fetching contact_messages:', cmError);
      }

      const allMessages: ContactMessage[] = (contactMessages || []).map((cm) => {
        const dir = String((cm as any).direction || '').toLowerCase();
        const normalizedDir: 'sent' | 'received' = dir === 'enviada' ? 'sent' : 'received';
        const dataMsg = (cm as any).data_mensagem;
        return {
          id: cm.id,
          message_content: (cm as any).mensagem || '',
          status: normalizedDir,
          sentiment: (cm as any).sentiment || null,
          sent_at: normalizedDir === 'sent' ? dataMsg : null,
          read_at: null,
          responded_at: normalizedDir === 'received' ? dataMsg : null,
          event_name: 'Histórico',
          created_at: dataMsg,
          direction: normalizedDir,
        };
      });

      allMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Excluir apenas mensagens vazias
      const messagesWithTextOnly = allMessages.filter((m) => (m.message_content || '').trim().length > 0);

      // Contagens exatas no banco para remover limite padrão de 1000
      const [
        { count: eventMsgCount } = { count: 0 } as any,
        { count: meSentCount } = { count: 0 } as any,
        { count: meRespBubbleCount } = { count: 0 } as any,
        { count: emReadCount } = { count: 0 } as any,
        { count: meReadCount } = { count: 0 } as any,
        { count: emRespCount } = { count: 0 } as any,
        { count: meRespCount } = { count: 0 } as any,
        { count: cmCount } = { count: 0 } as any,
      ] = await Promise.all([
        // Total de mensagens em event_messages (cada linha é uma bolha)
        supabase
          .from('event_messages')
          .select('id', { count: 'exact', head: true })
          .eq('contact_phone', contactPhone)
          .eq('organization_id', organization.id),
        // Total de bolhas "enviadas" em mensagens_enviadas (tem campo mensagem)
        supabase
          .from('mensagens_enviadas')
          .select('id', { count: 'exact', head: true })
          .eq('celular', contactPhone)
          .eq('organization_id', organization.id)
          .not('mensagem', 'is', null),
        // Total de bolhas "recebidas" (respostas de usuário) em mensagens_enviadas
        supabase
          .from('mensagens_enviadas')
          .select('id', { count: 'exact', head: true })
          .eq('celular', contactPhone)
          .eq('organization_id', organization.id)
          .not('resposta_usuario', 'is', null)
          .not('data_resposta', 'is', null),
        // Mensagens lidas: event_messages.read_at não nulo
        supabase
          .from('event_messages')
          .select('id', { count: 'exact', head: true })
          .eq('contact_phone', contactPhone)
          .eq('organization_id', organization.id)
          .not('read_at', 'is', null),
        // Mensagens lidas: mensagens_enviadas.data_leitura não nulo
        supabase
          .from('mensagens_enviadas')
          .select('id', { count: 'exact', head: true })
          .eq('celular', contactPhone)
          .eq('organization_id', organization.id)
          .not('data_leitura', 'is', null),
        // Respondidas: event_messages.responded_at não nulo
        supabase
          .from('event_messages')
          .select('id', { count: 'exact', head: true })
          .eq('contact_phone', contactPhone)
          .eq('organization_id', organization.id)
          .not('responded_at', 'is', null),
        // Respondidas: mensagens_enviadas.data_resposta não nulo
        supabase
          .from('mensagens_enviadas')
          .select('id', { count: 'exact', head: true })
          .eq('celular', contactPhone)
          .eq('organization_id', organization.id)
          .not('data_resposta', 'is', null),
        // Total de mensagens no contact_messages
        supabase
          .from('contact_messages')
          .select('id', { count: 'exact', head: true })
          .eq('celular', contactPhone)
          .eq('organization_id', organization.id),
      ]);

      const stats = {
        totalEvents: uniqueEvents.length,
        // Total de mensagens exibidas (apenas as que têm texto, sem duplicata com prefixo de data)
        totalMessages: messagesWithTextOnly.length,
        // Lidas exatas somando ambas fontes (contact_messages não tem campo de leitura)
        readMessages: (emReadCount || 0) + (meReadCount || 0),
        // Respondidas exatas somando ambas fontes (contact_messages não tem responded_at)
        respondedMessages: (emRespCount || 0) + (meRespCount || 0),
        // Mantém contagem de sentimentos baseada nas mensagens exibidas (com texto apenas)
        sentimentCounts: {
          superEngajado: messagesWithTextOnly.filter(m => m.sentiment === 'super engajado' || m.sentiment === 'super_engajado').length,
          positivo: messagesWithTextOnly.filter(m => m.sentiment === 'positivo').length,
          neutro: messagesWithTextOnly.filter(m => m.sentiment === 'neutro').length,
          negativo: messagesWithTextOnly.filter(m => m.sentiment === 'negativo').length,
          semClassificacao: messagesWithTextOnly.filter(m => m.sentiment === null).length,
        },
      };

      return {
        contact,
        fullName,
        events: uniqueEvents,
        messages: messagesWithTextOnly,
        stats,
      };
    },
    enabled: !!contactPhone && !!organization?.id,
  });

  return {
    profileData: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
  };
};
