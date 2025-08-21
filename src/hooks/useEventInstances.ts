
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useEventInstances = (eventId: string) => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['event-instances', eventId, organization?.id],
    queryFn: async () => {
      if (!organization?.id || !eventId) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('campanha_instancia')
        .select('id_instancia, prioridade')
        .eq('id_campanha', eventId) // Mudança: usar id_campanha ao invés de id_evento
        .order('prioridade');

      if (error) throw error;
      
      if (!data || data.length === 0) return [];

      // Get instance details
      const instanceIds = data.map(item => item.id_instancia);
      const { data: instances, error: instancesError } = await supabase
        .from('instances_safe')
        .select('id, name, phone_number, status')
        .in('id', instanceIds);

      if (instancesError) throw instancesError;

      // Combine the data
      return data.map(item => ({
        id_instancia: item.id_instancia,
        prioridade: item.prioridade,
        instances_safe: instances?.find(inst => inst.id === item.id_instancia)
      }));
    },
    enabled: !!organization?.id && !!eventId,
  });
};
