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

export interface Distrito {
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

// Fetch districts (distritos) from IBGE by municipality ID
export const useDistritos = (municipioId: number | null, searchTerm: string) => {
  const debouncedSearch = useDebounce(searchTerm, 300);

  return useQuery<Distrito[]>({
    queryKey: ['ibge-distritos', municipioId, debouncedSearch],
    queryFn: async () => {
      if (!municipioId) return [];

      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${municipioId}/distritos`
      );
      if (!response.ok) throw new Error('Erro ao buscar distritos');

      const data: any[] = await response.json();

      // Normalize names - remove common prefixes
      const normalized = data.map(d => ({
        id: d.id,
        nome: d.nome
          .replace(/^Distrito d[aoe]\s*/i, '')
          .replace(/^Sede\s*/i, '')
          .trim()
      }));

      // Remove duplicates and filter by search
      const uniqueNames = Array.from(new Set(normalized.map(d => d.nome)));
      const uniqueDistritos = uniqueNames.map(nome => {
        const found = normalized.find(d => d.nome === nome);
        return found!;
      });

      // Filter by search term if provided
      if (debouncedSearch && debouncedSearch.length >= 2) {
        return uniqueDistritos.filter(d =>
          d.nome.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }

      return uniqueDistritos;
    },
    enabled: !!municipioId && debouncedSearch.length >= 2,
    staleTime: 1000 * 60 * 60, // Cache por 1 hora
  });
};

// Fetch subdistricts (subdistritos/administrações regionais) from IBGE by municipality ID
export const useSubdistritos = (municipioId: number | null, searchTerm: string) => {
  const debouncedSearch = useDebounce(searchTerm, 300);

  return useQuery<Distrito[]>({
    queryKey: ['ibge-subdistritos', municipioId, debouncedSearch],
    queryFn: async () => {
      if (!municipioId) return [];

      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${municipioId}/subdistritos`
      );
      if (!response.ok) throw new Error('Erro ao buscar subdistritos');

      const data: any[] = await response.json();

      // Normalize names - remove prefixes like "Administração Regional de/do/da"
      const normalized = data.map(s => ({
        id: s.id,
        nome: s.nome
          .replace(/^Administra[çc][aã]o Regional d[aoe]\s*/i, '')
          .replace(/^Subdistrito d[aoe]\s*/i, '')
          .replace(/^Regi[aã]o d[aoe]\s*/i, '')
          .trim()
      }));

      // Remove duplicates
      const uniqueNames = Array.from(new Set(normalized.map(s => s.nome)));
      const uniqueSubdistritos = uniqueNames.map(nome => {
        const found = normalized.find(s => s.nome === nome);
        return found!;
      });

      // Filter by search term if provided
      if (debouncedSearch && debouncedSearch.length >= 2) {
        return uniqueSubdistritos.filter(s =>
          s.nome.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }

      return uniqueSubdistritos;
    },
    enabled: !!municipioId && debouncedSearch.length >= 2,
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
