
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useErrorHandler } from './useErrorHandler';
import { slugify } from '@/lib/slugify';

export interface Event {
  id: string;
  name: string;
  event_id: string; // ID customizável pelo usuário
  slug: string; // URL-friendly slug
  location?: string;
  event_date?: string;
  instance_ids?: string[];
  message_text: string;
  message_image?: string;
  image_filename?: string;
  mime_type?: string;
  media_type?: string;
  organization_id: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export const useEvents = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const { handleError, validateRequired } = useErrorHandler();

  const eventsQuery = useQuery({
    queryKey: ['events', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.warn('No organization ID available for events query');
        return [];
      }
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!organization?.id,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Subscribe to real-time updates for events (instance_ids changes)
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel('events_instance_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `organization_id=eq.${organization.id}`
        },
        () => {
          // Invalidate events query to refetch updated instance_ids
          queryClient.invalidateQueries({ queryKey: ['events', organization.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, queryClient]);

  const createEvent = useMutation({
    mutationFn: async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'slug'>) => {
      if (!validateRequired(eventData, ['name', 'event_id', 'message_text', 'organization_id'])) {
        throw new Error('Campos obrigatórios não preenchidos');
      }

      // Generate slug from name
      const slug = slugify(eventData.name);

      const sanitizedData = {
        ...eventData,
        name: eventData.name.trim(),
        event_id: eventData.event_id.trim(),
        slug,
        location: eventData.location?.trim() || null,
        message_text: eventData.message_text.trim(),
        status: eventData.status || 'draft'
      };

      const { data, error } = await supabase
        .from('events')
        .insert([sanitizedData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Evento criado com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'Criar evento');
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Event> & { id: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Evento atualizado com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'Atualizar evento');
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Evento excluído com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'Excluir evento');
    },
  });

  const uploadEventImage = async (file: File, eventName: string) => {
    const isVideo = file.type === 'video/mp4';
    const ext = isVideo ? 'mp4' : 'png';
    const fileName = `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
    
    const { error } = await supabase.storage
      .from('event-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(fileName);

    return { url: publicUrl, filename: fileName };
  };

  const getEventInstances = async (eventId: string) => {
    // First try to find by id_evento (for events), then fallback to id_campanha (for campaigns)
    let { data, error } = await supabase
      .from('campanha_instancia')
      .select('id_instancia')
      .eq('id_evento', eventId);

    // If no data found, try with id_campanha for backward compatibility
    if (!data || data.length === 0) {
      const result = await supabase
        .from('campanha_instancia')
        .select('id_instancia')
        .eq('id_campanha', eventId);
      
      data = result.data;
      error = result.error;
    }

    if (error) throw error;
    return (data || []).map(item => item.id_instancia);
  };

  const syncEventInstances = async (eventId: string, instanceIds: string[]) => {
    // Remove existing associations (check both id_evento and id_campanha for cleanup)
    await supabase
      .from('campanha_instancia')
      .delete()
      .eq('id_evento', eventId);
    
    // Also remove any legacy associations with id_campanha
    await supabase
      .from('campanha_instancia')
      .delete()
      .eq('id_campanha', eventId);

    // Add new associations using id_evento for events
    if (instanceIds.length > 0) {
      const associations = instanceIds.map((instanceId, index) => ({
        id_evento: eventId,
        id_instancia: instanceId,
        prioridade: index
      }));

      const { error } = await supabase
        .from('campanha_instancia')
        .insert(associations);

      if (error) throw error;
    }
  };

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
    createEvent,
    updateEvent,
    deleteEvent,
    uploadEventImage,
    getEventInstances,
    syncEventInstances,
    refetch: eventsQuery.refetch,
  };
};

export const useEvent = (eventId: string) => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['event', organization?.id, eventId],
    queryFn: async () => {
      if (!organization?.id || !eventId) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('organization_id', organization.id)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!organization?.id && !!eventId,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
