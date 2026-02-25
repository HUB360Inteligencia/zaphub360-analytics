import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PositionData {
  cargo: string;
  usage_count: number;
}

export const useEventPositions = () => {
  const { user, organization } = useAuth();

  const positionsQuery = useQuery({
    queryKey: ["event-positions", organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error("Organization not found");
      }

      const { data, error } = await supabase
        .from("checkins_evento")
        .select("cargo")
        .eq("organization_id", organization.id)
        .not("cargo", "is", null)
        .not("cargo", "eq", "");

      if (error) throw error;

      // Agrupar e contar ocorrências
      const positionMap = new Map<string, number>();
      
      data.forEach((row) => {
        if (row.cargo) {
          const count = positionMap.get(row.cargo) || 0;
          positionMap.set(row.cargo, count + 1);
        }
      });

      // Converter para array e ordenar por uso
      const positions: PositionData[] = Array.from(positionMap.entries())
        .map(([cargo, usage_count]) => ({ cargo, usage_count }))
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 20); // Limitar aos 20 mais usados

      return positions;
    },
    enabled: !!organization?.id && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    positions: positionsQuery.data || [],
    isLoading: positionsQuery.isLoading,
    error: positionsQuery.error,
  };
};
