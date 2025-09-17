
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicEvent {
  id: string;
  event_id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  message_text: string;
  message_image: string | null;
  status: string;
}

export const usePublicEvent = (eventId?: string) => {
  const publicEventQuery = useQuery({
    queryKey: ['public-event', eventId],
    queryFn: async (): Promise<PublicEvent | null> => {
      if (!eventId) {
        return null;
      }

      // Buscar evento por event_id (string) ao invés de UUID
      const { data: event, error } = await supabase
        .from('events')
        .select('id, event_id, name, event_date, location, message_text, message_image, status')
        .eq('event_id', eventId)
        .single();

      if (error) {
        console.error('Error fetching public event:', error);
        throw error;
      }

      return event;
    },
    enabled: !!eventId,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    data: publicEventQuery.data,
    isLoading: publicEventQuery.isLoading,
    error: publicEventQuery.error,
    refetch: publicEventQuery.refetch,
  };
};
