
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
      
      // First try to find by id_evento (for events), then fallback to id_campanha (for campaigns)
      let { data, error } = await supabase
        .from('campanha_instancia')
        .select('id_instancia, prioridade')
        .eq('id_evento', eventId)
        .order('prioridade');

      // If no data found, try with id_campanha for backward compatibility
      if (!data || data.length === 0) {
        const result = await supabase
          .from('campanha_instancia')
          .select('id_instancia, prioridade')
          .eq('id_campanha', eventId)
          .order('prioridade');
        
        data = result.data;
        error = result.error;
      }

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
