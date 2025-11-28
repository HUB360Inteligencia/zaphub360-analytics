import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './useDebounce';

export interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

export interface Cidade {
  id: number;
  nome: string;
}

// Fetch all Brazilian states from IBGE
export const useEstados = () => {
  return useQuery<Estado[]>({
    queryKey: ['ibge-estados'],
    queryFn: async () => {
      const response = await fetch(
        'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'
      );
      if (!response.ok) throw new Error('Erro ao buscar estados');
      return response.json();
    },
    staleTime: Infinity, // Estados não mudam
  });
};

// Fetch cities from a specific state from IBGE
export const useCidades = (uf: string, searchTerm: string) => {
  const debouncedSearch = useDebounce(searchTerm, 300);

  return useQuery<Cidade[]>({
    queryKey: ['ibge-cidades', uf, debouncedSearch],
    queryFn: async () => {
      if (!uf) return [];
      
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
      );
      if (!response.ok) throw new Error('Erro ao buscar cidades');
      const data: Cidade[] = await response.json();
      
      // Filter by search term if provided
      if (debouncedSearch && debouncedSearch.length >= 3) {
        return data.filter(cidade =>
          cidade.nome.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }
      
      return data;
    },
    enabled: !!uf && debouncedSearch.length >= 3,
    staleTime: 1000 * 60 * 60, // Cache por 1 hora
  });
};

// Fetch neighborhoods from historical data
export const useBairros = (cidade: string, organizationId: string) => {
  return useQuery<string[]>({
    queryKey: ['bairros-historicos', cidade, organizationId],
    queryFn: async () => {
      if (!cidade || !organizationId) return [];

      const { data, error } = await supabase
        .from('new_contact_event')
        .select('bairro')
        .eq('organization_id', organizationId)
        .eq('cidade', cidade)
        .not('bairro', 'is', null)
        .order('bairro');

      if (error) throw error;

      // Get unique neighborhoods
      const uniqueBairros = Array.from(
        new Set(data.map(item => item.bairro).filter(Boolean))
      ) as string[];

      return uniqueBairros;
    },
    enabled: !!cidade && !!organizationId,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
};
