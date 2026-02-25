import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CheckinFormData {
  nome: string;
  sobrenome?: string;
  celular: string;
  estado?: string; // UF - apenas para UX, não salvo
  bairro?: string;
  cidade?: string;
  cargo?: string;
  data_aniversario_text?: string;
}

export const useEventCheckin = (eventId: string) => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();

  // Permission check removed - any organization user can check-in

  // Fetch check-ins for event
  const checkinsQuery = useQuery({
    queryKey: ['checkins', eventId, organization?.id],
    queryFn: async () => {
      if (!organization?.id || !eventId) return [];

      const { data, error } = await supabase
        .from('checkins_evento')
        .select(`
          *,
          contacts (
            id,
            name,
            phone,
            email
          )
        `)
        .eq('event_id', eventId)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id && !!eventId,
  });

  // Fetch message queue for event from mensagens_enviadas
  const messagesQueueQuery = useQuery({
    queryKey: ['event-messages-queue', eventId, organization?.id],
    queryFn: async () => {
      if (!organization?.id || !eventId) return [];

      const { data, error } = await supabase
        .from('mensagens_enviadas')
        .select('*')
        .eq('id_campanha', eventId)
        .eq('tipo_fluxo', 'evento')
        .eq('organization_id', organization.id)
        .order('id', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id && !!eventId,
  });

  // Normalize phone number to MSISDN format
  const normalizePhone = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If starts with 0, remove it (common in Brazilian numbers)
    if (digits.startsWith('0')) {
      return digits.substring(1);
    }
    
    return digits;
  };

  // Perform check-in
  const performCheckin = useMutation({
    mutationFn: async (formData: CheckinFormData) => {
      if (!organization?.id || !eventId || !user?.id) {
        throw new Error('Organização, evento ou usuário não identificado');
      }

      const normalizedPhone = normalizePhone(formData.celular);

      // Validate phone number
      if (normalizedPhone.length < 10 || normalizedPhone.length > 13) {
        throw new Error('Número de telefone inválido');
      }

      // Concatenate nome + sobrenome for full name
      const fullName = formData.sobrenome 
        ? `${formData.nome} ${formData.sobrenome}`
        : formData.nome;

      // Upsert contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .upsert(
          {
            phone: normalizedPhone,
            name: fullName,
            organization_id: organization.id,
            origin: 'checkin_evento',
            status: 'active',
          },
          {
            onConflict: 'organization_id,phone',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (contactError) throw contactError;
      if (!contact) throw new Error('Erro ao criar/atualizar contato');

      // Get event details first
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Get instance: first from new_contact_event, then from event's instance_ids
      const { data: existingContact } = await supabase
        .from('new_contact_event')
        .select('ultima_instancia')
        .eq('celular', normalizedPhone)
        .eq('organization_id', organization.id)
        .maybeSingle();

      let instanceId = existingContact?.ultima_instancia || null;

      // If no instance, get from event's instance_ids column
      if (!instanceId && event.instance_ids && event.instance_ids.length > 0) {
        instanceId = event.instance_ids[0];
      }

      // Insert check-in
      const { data: checkin, error: checkinError } = await supabase
        .from('checkins_evento')
        .insert({
          event_id: eventId,
          contact_id: contact.id,
          nome: formData.nome,
          celular: normalizedPhone,
          bairro: formData.bairro || null,
          cidade: formData.cidade || null,
          cargo: formData.cargo || null,
          data_aniversario_text: formData.data_aniversario_text || null,
          organization_id: organization.id,
          checked_in_by: user.id,
        })
        .select()
        .single();

      if (checkinError) throw checkinError;

      // Insert/Update contact in event contacts table with history
      const { data: eventContactId, error: eventContactError } = await supabase
        .rpc('upsert_new_contact_event_min', {
          _name: formData.nome,
          _celular: normalizedPhone,
          _evento: event.name,
          _sobrenome: formData.sobrenome || '',
          _organization_id: organization.id,
          _perfil_contato: formData.cargo || '',
        });

      if (eventContactError) {
        console.error('Erro ao atualizar contato do evento:', eventContactError);
      }

      // Update additional event contact fields
      if (eventContactId) {
        await supabase
          .from('new_contact_event')
          .update({
            bairro: formData.bairro || null,
            cidade: formData.cidade || null,
            ultima_instancia: instanceId,
            responsavel_cadastro: user.email || user.id,
            event_id: event.event_id ? parseInt(event.event_id) : null,
          })
          .eq('id_contact_event', eventContactId)
          .eq('organization_id', organization.id);
      }

      // Render message with placeholders
      let messageText = event.message_text;
      const placeholders: Record<string, string> = {
        '{{nome}}': formData.nome,
        '{{bairro}}': formData.bairro || '',
        '{{cidade}}': formData.cidade || '',
        '{{cargo}}': formData.cargo || '',
        '{{data_aniversario_text}}': formData.data_aniversario_text || '',
        '{{nome_evento}}': event.name,
        '{{data_evento}}': event.event_date
          ? new Date(event.event_date).toLocaleDateString('pt-BR')
          : '',
      };

      Object.entries(placeholders).forEach(([key, value]) => {
        messageText = messageText.replace(new RegExp(key, 'g'), value);
      });

      // Calculate random delay between tempo_min and tempo_max
      const tempoMin = event.tempo_min || 30;
      const tempoMax = event.tempo_max || 60;
      const delay = Math.floor(Math.random() * (tempoMax - tempoMin + 1)) + tempoMin;

      // Insert message in mensagens_enviadas
      const { error: messageError } = await supabase
        .from('mensagens_enviadas')
        .insert({
          tipo_fluxo: 'evento',
          id_campanha: eventId,
          celular: normalizedPhone,
          mensagem: messageText,
          nome_contato: formData.nome,
          perfil_contato: formData.cargo || null,
          url_media: event.message_image || null,
          media_type: event.media_type || null,
          name_media: event.image_filename || null,
          mime_type: event.mime_type || null,
          caption_media: messageText,
          instancia_id: instanceId,
          status: 'pendente',
          organization_id: organization.id,
          id_tipo_mensagem: event.id_tipo_mensagem || 1,
          'tempo delay': delay,
        });

      if (messageError) throw messageError;

      return checkin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-messages-queue', eventId] });
      toast.success('Check-in realizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao realizar check-in:', error);
      toast.error(error.message || 'Erro ao realizar check-in');
    },
  });

  return {
    hasPermission: true, // Any organization user can check-in
    isLoadingPermission: false,
    checkins: checkinsQuery.data || [],
    isLoadingCheckins: checkinsQuery.isLoading,
    messagesQueue: messagesQueueQuery.data || [],
    isLoadingMessages: messagesQueueQuery.isLoading,
    performCheckin,
  };
};
