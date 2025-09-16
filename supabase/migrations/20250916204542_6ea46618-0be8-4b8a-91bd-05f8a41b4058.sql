-- Corrigir search_path das funções criadas anteriormente para segurança

-- Atualizar função get_grouped_events
CREATE OR REPLACE FUNCTION public.get_grouped_events(contact_phone text, org_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  events_list text[];
  result_text text;
BEGIN
  -- Buscar todos os eventos únicos deste contato
  SELECT array_agg(DISTINCT evento)
  INTO events_list
  FROM new_contact_event
  WHERE celular = contact_phone 
    AND organization_id = org_id 
    AND evento IS NOT NULL 
    AND evento != '';
    
  -- Juntar os eventos com vírgula
  IF events_list IS NOT NULL AND array_length(events_list, 1) > 0 THEN
    result_text := array_to_string(events_list, ', ');
  ELSE
    result_text := NULL;
  END IF;
  
  RETURN result_text;
END;
$$;

-- Atualizar função get_grouped_tags
CREATE OR REPLACE FUNCTION public.get_grouped_tags(contact_phone text, org_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tags_list text[];
  result_text text;
BEGIN
  -- Buscar todas as tags únicas deste contato
  SELECT array_agg(DISTINCT tag)
  INTO tags_list
  FROM new_contact_event
  WHERE celular = contact_phone 
    AND organization_id = org_id 
    AND tag IS NOT NULL 
    AND tag != '';
    
  -- Juntar as tags com vírgula
  IF tags_list IS NOT NULL AND array_length(tags_list, 1) > 0 THEN
    result_text := array_to_string(tags_list, ', ');
  ELSE
    result_text := NULL;
  END IF;
  
  RETURN result_text;
END;
$$;

-- Atualizar função choose_best_value
CREATE OR REPLACE FUNCTION public.choose_best_value(val1 text, val2 text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Se um dos valores é nulo, retorna o outro
  IF val1 IS NULL AND val2 IS NOT NULL THEN
    RETURN val2;
  END IF;
  
  IF val2 IS NULL AND val1 IS NOT NULL THEN
    RETURN val1;
  END IF;
  
  -- Se ambos são nulos, retorna nulo
  IF val1 IS NULL AND val2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Se ambos têm valor, escolhe o mais longo (mais informação)
  IF length(val1) >= length(val2) THEN
    RETURN val1;
  ELSE
    RETURN val2;
  END IF;
END;
$$;