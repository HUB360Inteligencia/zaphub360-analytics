-- Função RPC para buscar contatos de campanha com ordenação customizada por status
CREATE OR REPLACE FUNCTION public.get_campaign_contacts_ordered(
  p_campaign_id UUID,
  p_organization_id UUID,
  p_search TEXT DEFAULT NULL,
  p_statuses TEXT[] DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'nome_contato',
  p_sort_direction TEXT DEFAULT 'asc',
  p_page_size INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  nome_contato TEXT,
  celular TEXT,
  status TEXT,
  sentimento TEXT,
  perfil_contato TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query TEXT;
  v_where_conditions TEXT[] := ARRAY[]::TEXT[];
  v_order_clause TEXT;
BEGIN
  -- Construir condições WHERE
  v_where_conditions := v_where_conditions || ARRAY['id_campanha = $1'];
  v_where_conditions := v_where_conditions || ARRAY['organization_id = $2'];
  
  -- Adicionar filtro de busca se fornecido
  IF p_search IS NOT NULL AND LENGTH(TRIM(p_search)) > 0 THEN
    IF p_search ~ '^\d+$' THEN
      -- Se for numérico, buscar por telefone exato ou nome parcial
      v_where_conditions := v_where_conditions || ARRAY[
        FORMAT('(celular = %L OR nome_contato ILIKE %L)', p_search, '%' || p_search || '%')
      ];
    ELSE
      -- Se não for numérico, buscar apenas por nome
      v_where_conditions := v_where_conditions || ARRAY[
        FORMAT('nome_contato ILIKE %L', '%' || p_search || '%')
      ];
    END IF;
  END IF;
  
  -- Adicionar filtro de status se fornecido
  IF p_statuses IS NOT NULL AND array_length(p_statuses, 1) > 0 THEN
    v_where_conditions := v_where_conditions || ARRAY[
      FORMAT('status = ANY(%L)', p_statuses)
    ];
  END IF;
  
  -- Construir cláusula ORDER BY
  IF p_sort_by = 'status' THEN
    -- Ordenação customizada por status usando CASE
    v_order_clause := FORMAT(
      'ORDER BY CASE status 
        WHEN ''fila'' THEN 1
        WHEN ''pendente'' THEN 2
        WHEN ''processando'' THEN 3
        WHEN ''enviado'' THEN 4
        WHEN ''erro'' THEN 5
        ELSE 6
      END %s, nome_contato ASC',
      CASE WHEN p_sort_direction = 'desc' THEN 'DESC' ELSE 'ASC' END
    );
  ELSE
    -- Ordenação padrão para outros campos
    v_order_clause := FORMAT(
      'ORDER BY %I %s',
      p_sort_by,
      CASE WHEN p_sort_direction = 'desc' THEN 'DESC' ELSE 'ASC' END
    );
  END IF;
  
  -- Construir e executar query
  v_query := FORMAT(
    'SELECT 
      m.id,
      m.nome_contato,
      m.celular,
      m.status,
      m.sentimento,
      m.perfil_contato,
      COUNT(*) OVER() as total_count
    FROM mensagens_enviadas m
    WHERE %s
    %s
    LIMIT %s OFFSET %s',
    array_to_string(v_where_conditions, ' AND '),
    v_order_clause,
    p_page_size,
    p_offset
  );
  
  RETURN QUERY EXECUTE v_query USING p_campaign_id, p_organization_id;
END;
$$;

-- Conceder permissões para a função
GRANT EXECUTE ON FUNCTION public.get_campaign_contacts_ordered TO authenticated;