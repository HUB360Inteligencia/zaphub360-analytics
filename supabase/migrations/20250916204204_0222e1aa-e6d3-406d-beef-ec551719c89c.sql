-- Primeiro, vamos criar uma função para agrupar eventos de um contato
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

-- Função para agrupar tags de um contato
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

-- Função para escolher o melhor valor entre duplicatas (mais completo)
CREATE OR REPLACE FUNCTION public.choose_best_value(val1 text, val2 text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
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

-- Agora vamos dedupilicar os contatos
WITH duplicated_contacts AS (
  -- Identificar contatos com mesmo telefone e organização
  SELECT 
    celular,
    organization_id,
    COUNT(*) as contact_count
  FROM new_contact_event
  WHERE celular IS NOT NULL 
    AND organization_id IS NOT NULL
  GROUP BY celular, organization_id
  HAVING COUNT(*) > 1
),
best_contact_data AS (
  -- Para cada grupo duplicado, escolher os melhores dados
  SELECT DISTINCT ON (nce.celular, nce.organization_id)
    nce.celular,
    nce.organization_id,
    -- Escolher o nome mais completo
    (SELECT choose_best_value(name1, name2) 
     FROM (
       SELECT 
         nce1.name as name1, 
         nce2.name as name2
       FROM new_contact_event nce1, new_contact_event nce2
       WHERE nce1.celular = nce.celular 
         AND nce1.organization_id = nce.organization_id
         AND nce2.celular = nce.celular 
         AND nce2.organization_id = nce.organization_id
         AND nce1.id_contact_event != nce2.id_contact_event
       ORDER BY 
         CASE WHEN nce1.name IS NOT NULL AND length(nce1.name) > 0 THEN length(nce1.name) ELSE 0 END DESC,
         CASE WHEN nce2.name IS NOT NULL AND length(nce2.name) > 0 THEN length(nce2.name) ELSE 0 END DESC
       LIMIT 1
     ) as names
    ) as best_name,
    -- Escolher o sobrenome mais completo
    (SELECT sobrenome FROM new_contact_event nce_inner 
     WHERE nce_inner.celular = nce.celular 
       AND nce_inner.organization_id = nce.organization_id
       AND sobrenome IS NOT NULL 
       AND sobrenome != ''
     ORDER BY length(sobrenome) DESC 
     LIMIT 1) as best_sobrenome,
    -- Escolher a cidade mais completa
    (SELECT cidade FROM new_contact_event nce_inner
     WHERE nce_inner.celular = nce.celular 
       AND nce_inner.organization_id = nce.organization_id
       AND cidade IS NOT NULL 
       AND cidade != ''
     ORDER BY length(cidade) DESC 
     LIMIT 1) as best_cidade,
    -- Escolher o bairro mais completo
    (SELECT bairro FROM new_contact_event nce_inner
     WHERE nce_inner.celular = nce.celular 
       AND nce_inner.organization_id = nce.organization_id
       AND bairro IS NOT NULL 
       AND bairro != ''
     ORDER BY length(bairro) DESC 
     LIMIT 1) as best_bairro,
    -- Agrupar eventos
    get_grouped_events(nce.celular, nce.organization_id) as grouped_events,
    -- Agrupar tags
    get_grouped_tags(nce.celular, nce.organization_id) as grouped_tags,
    -- Pegar o sentimento mais recente
    (SELECT sentimento FROM new_contact_event nce_inner
     WHERE nce_inner.celular = nce.celular 
       AND nce_inner.organization_id = nce.organization_id
       AND sentimento IS NOT NULL
     ORDER BY updated_at DESC NULLS LAST, created_at DESC 
     LIMIT 1) as latest_sentiment,
    -- Pegar última instância
    (SELECT ultima_instancia FROM new_contact_event nce_inner
     WHERE nce_inner.celular = nce.celular 
       AND nce_inner.organization_id = nce.organization_id
       AND ultima_instancia IS NOT NULL
     ORDER BY updated_at DESC NULLS LAST, created_at DESC 
     LIMIT 1) as latest_instancia,
    -- Pegar o perfil mais completo
    (SELECT perfil FROM new_contact_event nce_inner
     WHERE nce_inner.celular = nce.celular 
       AND nce_inner.organization_id = nce.organization_id
       AND perfil IS NOT NULL 
       AND perfil != ''
     ORDER BY length(perfil) DESC 
     LIMIT 1) as best_perfil,
    -- Manter o ID mais antigo (primeira entrada)
    MIN(nce.id_contact_event) as keep_id,
    -- Data de criação mais antiga
    MIN(nce.created_at) as earliest_created,
    -- Data de atualização mais recente
    MAX(COALESCE(nce.updated_at, nce.created_at)) as latest_updated
  FROM new_contact_event nce
  INNER JOIN duplicated_contacts dc ON dc.celular = nce.celular 
    AND dc.organization_id = nce.organization_id
  GROUP BY nce.celular, nce.organization_id
)
-- Atualizar o registro que vamos manter com as informações consolidadas
UPDATE new_contact_event
SET 
  name = COALESCE(bcd.best_name, new_contact_event.name),
  sobrenome = COALESCE(bcd.best_sobrenome, new_contact_event.sobrenome),
  cidade = COALESCE(bcd.best_cidade, new_contact_event.cidade),
  bairro = COALESCE(bcd.best_bairro, new_contact_event.bairro),
  evento = COALESCE(bcd.grouped_events, new_contact_event.evento),
  tag = COALESCE(bcd.grouped_tags, new_contact_event.tag),
  sentimento = COALESCE(bcd.latest_sentiment, new_contact_event.sentimento),
  ultima_instancia = COALESCE(bcd.latest_instancia, new_contact_event.ultima_instancia),
  perfil = COALESCE(bcd.best_perfil, new_contact_event.perfil),
  created_at = bcd.earliest_created,
  updated_at = bcd.latest_updated
FROM best_contact_data bcd
WHERE new_contact_event.id_contact_event = bcd.keep_id;

-- Remover os registros duplicados (manter apenas o consolidado)
WITH duplicated_contacts AS (
  SELECT 
    celular,
    organization_id,
    COUNT(*) as contact_count
  FROM new_contact_event
  WHERE celular IS NOT NULL 
    AND organization_id IS NOT NULL
  GROUP BY celular, organization_id
  HAVING COUNT(*) > 1
),
records_to_keep AS (
  SELECT MIN(nce.id_contact_event) as keep_id
  FROM new_contact_event nce
  INNER JOIN duplicated_contacts dc ON dc.celular = nce.celular 
    AND dc.organization_id = nce.organization_id
  GROUP BY nce.celular, nce.organization_id
)
DELETE FROM new_contact_event
WHERE id_contact_event NOT IN (SELECT keep_id FROM records_to_keep)
  AND (celular, organization_id) IN (
    SELECT celular, organization_id FROM duplicated_contacts
  );

-- Criar um índice único para evitar duplicações futuras
CREATE UNIQUE INDEX IF NOT EXISTS idx_new_contact_event_unique_phone_org 
ON new_contact_event (celular, organization_id) 
WHERE celular IS NOT NULL AND organization_id IS NOT NULL;