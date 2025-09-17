
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  notes?: string | null;
  status: 'active' | 'inactive';
  organization_id: string;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  // Campos de new_contact_event
  evento?: string;
  sentimento?: string;
  sobrenome?: string;
  cidade?: string;
  bairro?: string;
  responsavel_cadastro?: string;
  status_envio?: string;
  ultima_instancia?: string;
  id_tipo_mensagem?: number;
  media_url?: string | null;
  media_name?: string | null;
  media_type?: string | null;
  mime_type?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  organization_id: string;
}

const PAGE_SIZE = 1000; // pode reduzir p/ 200/500 se quiser

export const useContacts = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // -------- TOTAL (real, sem baixar linhas) --------
  const totalCountQuery = useQuery({
    queryKey: ['contacts-total', organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('new_contact_event')
        .select('id_contact_event', { count: 'exact', head: true })
        .eq('organization_id', organization!.id);

      if (error) throw error;
      return count ?? 0;
    },
  });

  // -------- LISTA PAGINADA (só a página atual) --------
  const [page, setPage] = useState(0);

  const contactsQuery = useQuery({
    queryKey: ['contacts', organization?.id, page],
    enabled: !!organization?.id,
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('new_contact_event')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false })
        .range(from, to); // 0–999, 1000–1999, ...

      if (error) throw error;

      const mapped = (data ?? []).map((contact) => ({
        id: contact.id_contact_event?.toString(),
        name: contact.name || 'Sem nome',
        phone: contact.celular,
        email: null,
        company: null,
        notes: contact.evento ? `Evento: ${contact.evento}` : null,
        status: 'active' as const, // ajuste se quiser usar realmente ativo/inativo
        organization_id: contact.organization_id,
        created_at: contact.created_at,
        updated_at: contact.updated_at || contact.created_at,
        tags: [],
        evento: contact.evento,
        sentimento: contact.sentimento,
        sobrenome: contact.sobrenome,
        cidade: contact.cidade,
        bairro: contact.bairro,
        responsavel_cadastro: contact.responsavel_cadastro,
        status_envio: contact.status_envio,
        ultima_instancia: contact.ultima_instancia,
        media_url: contact.media_url,
        media_name: contact.media_name,
        media_type: contact.media_type,
        mime_type: contact.mime_type,
      })) as Contact[];

      return mapped;
    },
  });

  // utilidade para recarregar após trocar org
  useEffect(() => {
    setPage(0);
  }, [organization?.id]);

  // -------- MUTATIONS (mantidas) --------
  const createContact = useMutation({
    mutationFn: async (
      contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'tags'> & { mediaFile?: File }
    ) => {
      let mediaUrl: string | null = null;
      let mediaName: string | null = null;
      let mediaType: string | null = null;
      let mimeType: string | null = null;

      if (contactData.mediaFile) {
        const fileExt = contactData.mediaFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('message-content-media')
          .upload(fileName, contactData.mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('message-content-media')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
        mediaName = contactData.mediaFile.name;
        mediaType = contactData.mediaFile.type.startsWith('image/')
          ? 'image'
          : contactData.mediaFile.type.startsWith('video/')
          ? 'video'
          : 'document';
        mimeType = contactData.mediaFile.type;
      }

      const { data: existingContact, error: checkError } = await supabase
        .from('new_contact_event')
        .select('*')
        .eq('celular', contactData.phone)
        .eq('organization_id', contactData.organization_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingContact) {
        const updateData: any = { updated_at: new Date().toISOString() };

        if (contactData.name && (!existingContact.name || existingContact.name.length < contactData.name.length)) {
          updateData.name = contactData.name;
        }
        if (contactData.sobrenome && (!existingContact.sobrenome || existingContact.sobrenome.length < contactData.sobrenome.length)) {
          updateData.sobrenome = contactData.sobrenome;
        }
        if (contactData.cidade && (!existingContact.cidade || existingContact.cidade.length < contactData.cidade.length)) {
          updateData.cidade = contactData.cidade;
        }
        if (contactData.bairro && (!existingContact.bairro || existingContact.bairro.length < contactData.bairro.length)) {
          updateData.bairro = contactData.bairro;
        }
        if (contactData.evento && contactData.evento !== 'Contato Manual') {
          const existingEvents = existingContact.evento ? existingContact.evento.split(', ') : [];
          if (!existingEvents.includes(contactData.evento)) {
            updateData.evento = [...existingEvents, contactData.evento].join(', ');
          }
        }
        if (mediaUrl) {
          updateData.media_url = mediaUrl;
          updateData.media_name = mediaName;
          updateData.media_type = mediaType;
          updateData.mime_type = mimeType;
        }

        const { data, error } = await supabase
          .from('new_contact_event')
          .update(updateData)
          .eq('id_contact_event', existingContact.id_contact_event)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('new_contact_event')
          .insert({
            celular: contactData.phone,
            name: contactData.name,
            sobrenome: contactData.sobrenome || '',
            cidade: contactData.cidade || '',
            bairro: contactData.bairro || '',
            evento: contactData.evento || 'Contato Manual',
            organization_id: contactData.organization_id,
            responsavel_cadastro: 'Sistema',
            status_envio: 'pendente',
            id_tipo_mensagem: contactData.id_tipo_mensagem || 1,
            media_url: mediaUrl,
            media_name: mediaName,
            media_type: mediaType,
            mime_type: mimeType,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts-total'] });
      toast.success('Contato salvo com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar contato:', error);
      toast.error('Erro ao criar contato');
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from('new_contact_event')
        .update({
          name: updateData.name,
          sobrenome: updateData.sobrenome,
          cidade: updateData.cidade,
          bairro: updateData.bairro,
          evento: updateData.evento,
          sentimento: updateData.sentimento,
          updated_at: new Date().toISOString(),
        })
        .eq('id_contact_event', parseInt(id))
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contato atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar contato:', error);
      toast.error('Erro ao atualizar contato');
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('new_contact_event')
        .delete()
        .eq('id_contact_event', parseInt(id));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts-total'] });
      toast.success('Contato excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir contato:', error);
      toast.error('Erro ao excluir contato');
    },
  });

  // API pública do hook
  return {
    // lista da página atual
    contacts: contactsQuery.data || [],
    isLoading: contactsQuery.isLoading || totalCountQuery.isLoading,
    error: contactsQuery.error || totalCountQuery.error,

    // total real (mostre esse no dashboard!)
    totalCount: totalCountQuery.data ?? 0,

    // paginação
    page,
    setPage,
    PAGE_SIZE,

    // mutations
    createContact,
    updateContact,
    deleteContact,

    // util
    refetch: contactsQuery.refetch,
  };
};
