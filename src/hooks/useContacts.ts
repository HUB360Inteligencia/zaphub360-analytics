import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
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
  media_url?: string;
  media_name?: string;
  media_type?: string;
  mime_type?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  organization_id: string;
}

interface ContactsParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  filterCidade?: string;
  filterBairro?: string;
  filterSentimento?: string;
  selectedTag?: string;
  sortBy?: 'name' | 'cidade' | 'bairro' | 'sentimento' | 'evento';
  sortDirection?: 'asc' | 'desc';
}

// Hook para buscar contatos paginados
export const useContacts = (params: ContactsParams = {}) => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const { 
    page = 1, 
    pageSize = 50,
    searchTerm = '',
    filterCidade = 'all',
    filterBairro = 'all', 
    filterSentimento = 'all',
    selectedTag = 'all',
    sortBy = 'name',
    sortDirection = 'asc'
  } = params;

  const contactsQuery = useQuery({
    queryKey: ['contacts', organization?.id, page, pageSize, searchTerm, filterCidade, filterBairro, filterSentimento, selectedTag, sortBy, sortDirection],
    queryFn: async () => {
      if (!organization?.id) return { data: [], count: 0 };
      
      let query = supabase
        .from('new_contact_event')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization.id);

      // Aplicar filtros
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,celular.ilike.%${searchTerm}%,sobrenome.ilike.%${searchTerm}%`);
      }
      
      if (filterCidade !== 'all') {
        query = query.eq('cidade', filterCidade);
      }
      
      if (filterBairro !== 'all') {
        query = query.eq('bairro', filterBairro);
      }
      
      if (filterSentimento !== 'all') {
        query = query.ilike('sentimento', filterSentimento);
      }
      
      if (selectedTag !== 'all') {
        query = query.like('tag', `%${selectedTag}%`);
      }

      // Ordenação
      const sortColumn = sortBy === 'evento' ? 'evento' : sortBy;
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' });

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query.range(from, to);

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
          id: `tag-${index}`,
          name: tag,
          color: '#6B7280',
          organization_id: contact.organization_id
        })) : [],
        evento: contact.evento,
        sentimento: contact.sentimento,
        sobrenome: contact.sobrenome,
        cidade: contact.cidade,
        bairro: contact.bairro,
        responsavel_cadastro: contact.responsavel_cadastro,
        status_envio: contact.status_envio,
        ultima_instancia: contact.ultima_instancia,
      }));

      return { data: contacts, count: count || 0 };
    },
    enabled: !!organization?.id,
  });

  // Hook separado para estatísticas gerais (não paginadas)
  const statsQuery = useQuery({
    queryKey: ['contacts-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { total: 0, active: 0, withEmail: 0 };
      
      const { count: total } = await supabase
        .from('new_contact_event')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      const { count: active } = await supabase
        .from('new_contact_event')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status_envio', 'enviado');

      return { 
        total: total || 0, 
        active: active || 0, 
        withEmail: 0 // new_contact_event não tem email
      };
    },
    enabled: !!organization?.id,
  });

  // Hook para obter valores únicos para filtros - busca TODOS os dados
  const filtersQuery = useQuery({
    queryKey: ['contacts-filters', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { cidades: [], bairros: [], sentimentos: [] };

      let allData: any[] = [];
      let pageIndex = 0;
      const batchSize = 1000;

      // Buscar TODOS os dados em lotes
      while (true) {
        const from = pageIndex * batchSize;
        const to = from + batchSize - 1;

        const { data: pageData, error } = await supabase
          .from('new_contact_event')
          .select('cidade, bairro, sentimento')
          .eq('organization_id', organization.id)
          .range(from, to);

        if (error) throw error;
        if (!pageData || pageData.length === 0) break;

        allData = allData.concat(pageData);
        
        if (pageData.length < batchSize) break;
        pageIndex++;
      }

      // normaliza strings
      const norm = (s?: string | null) => (s ?? '').trim();

      const cidades = Array.from(
        new Set(allData.map(d => norm(d.cidade)).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

      const bairros = Array.from(
        new Set(allData.map(d => norm(d.bairro)).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

      const sentimentos = Array.from(
        new Set(allData.map(d => norm(d.sentimento)).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

      return { cidades, bairros, sentimentos };
    },
    enabled: !!organization?.id,
  });

  const createContact = useMutation({
    mutationFn: async (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'tags'> & { mediaFile?: File }) => {
      let mediaUrl = null;
      let mediaName = null;
      let mediaType = null;
      let mimeType = null;

      // Upload media se fornecido
      if (contactData.mediaFile) {
        const fileExt = contactData.mediaFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('message-content-media')
          .upload(fileName, contactData.mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('message-content-media')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
        mediaName = contactData.mediaFile.name;
        mediaType = contactData.mediaFile.type.startsWith('image/') ? 'image' : 
                   contactData.mediaFile.type.startsWith('video/') ? 'video' : 'document';
        mimeType = contactData.mediaFile.type;
      }

      // Primeiro verificar se já existe um contato com o mesmo telefone
      const { data: existingContact, error: checkError } = await supabase
        .from('new_contact_event')
        .select('*')
        .eq('celular', contactData.phone)
        .eq('organization_id', contactData.organization_id)
        .maybeSingle();

      if (checkError) throw checkError;

      // Se contato já existe, atualizar com informações complementares
      if (existingContact) {
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

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
        // Criar novo contato se não existir
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
      toast.success('Contato excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir contato:', error);
      toast.error('Erro ao excluir contato');
    },
  });

  return {
    contacts: contactsQuery.data?.data || [],
    contactsCount: contactsQuery.data?.count || 0,
    stats: statsQuery.data || { total: 0, active: 0, withEmail: 0 },
    filters: filtersQuery.data || { cidades: [], bairros: [], sentimentos: [] },
    isLoading: contactsQuery.isLoading,
    isStatsLoading: statsQuery.isLoading,
    isFiltersLoading: filtersQuery.isLoading,
    error: contactsQuery.error,
    createContact,
    updateContact,
    deleteContact,
    refetch: contactsQuery.refetch,
  };
};