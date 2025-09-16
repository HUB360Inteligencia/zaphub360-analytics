
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
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  organization_id: string;
}

export const useContacts = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ['contacts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      // Paginar em blocos de 1000 devido ao limite do PostgREST
      const pageSize = 1000;
      let from = 0;
      let to = pageSize - 1;
      let allData: any[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('contacts')
          .select(`
            *,
            contact_tags (
              tags (*)
            )
          `)
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (!data || data.length === 0) break;

        allData = allData.concat(data);
        if (data.length < pageSize) break;

        from += pageSize;
        to += pageSize;
      }

      return allData.map(contact => ({
        ...contact,
        tags: contact.contact_tags?.map((ct: any) => ct.tags) || []
      }));
    },
    enabled: !!organization?.id,
  });

  const createContact = useMutation({
    mutationFn: async (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'tags'>) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contato criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar contato:', error);
      toast.error('Erro ao criar contato');
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id)
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
        .from('contacts')
        .delete()
        .eq('id', id);

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
    contacts: contactsQuery.data || [],
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    createContact,
    updateContact,
    deleteContact,
    refetch: contactsQuery.refetch,
  };
};
