
-- Atualizar responded_at para contatos com sentiment classificado
-- Simular horários de resposta realísticos baseados em read_at, sent_at ou created_at

UPDATE event_messages 
SET responded_at = CASE 
  -- Se tem read_at, usar como base com intervalo baseado no sentiment
  WHEN read_at IS NOT NULL THEN 
    CASE sentiment
      WHEN 'super_engajado' THEN read_at + (INTERVAL '2 minutes') + (RANDOM() * INTERVAL '6 minutes')
      WHEN 'positivo' THEN read_at + (INTERVAL '5 minutes') + (RANDOM() * INTERVAL '10 minutes')
      WHEN 'neutro' THEN read_at + (INTERVAL '10 minutes') + (RANDOM() * INTERVAL '15 minutes')
      ELSE read_at + (INTERVAL '7 minutes') + (RANDOM() * INTERVAL '8 minutes')
    END
  -- Se não tem read_at mas tem sent_at, usar sent_at como base
  WHEN sent_at IS NOT NULL THEN 
    CASE sentiment
      WHEN 'super_engajado' THEN sent_at + (INTERVAL '15 minutes') + (RANDOM() * INTERVAL '15 minutes')
      WHEN 'positivo' THEN sent_at + (INTERVAL '20 minutes') + (RANDOM() * INTERVAL '25 minutes')
      WHEN 'neutro' THEN sent_at + (INTERVAL '30 minutes') + (RANDOM() * INTERVAL '30 minutes')
      ELSE sent_at + (INTERVAL '25 minutes') + (RANDOM() * INTERVAL '20 minutes')
    END
  -- Se não tem nem read_at nem sent_at, usar created_at
  ELSE 
    CASE sentiment
      WHEN 'super_engajado' THEN created_at + (INTERVAL '30 minutes') + (RANDOM() * INTERVAL '30 minutes')
      WHEN 'positivo' THEN created_at + (INTERVAL '45 minutes') + (RANDOM() * INTERVAL '45 minutes')
      WHEN 'neutro' THEN created_at + (INTERVAL '60 minutes') + (RANDOM() * INTERVAL '60 minutes')
      ELSE created_at + (INTERVAL '50 minutes') + (RANDOM() * INTERVAL '40 minutes')
    END
END
WHERE sentiment IS NOT NULL 
  AND responded_at IS NULL;

-- Verificar resultados da atualização
SELECT 
  sentiment,
  COUNT(*) as total_com_resposta,
  MIN(responded_at) as primeira_resposta,
  MAX(responded_at) as ultima_resposta
FROM event_messages 
WHERE sentiment IS NOT NULL 
  AND responded_at IS NOT NULL
GROUP BY sentiment
ORDER BY sentiment;

-- Verificar se responded_at está sempre após read_at e sent_at
SELECT 
  COUNT(*) as registros_com_problema
FROM event_messages 
WHERE sentiment IS NOT NULL 
  AND responded_at IS NOT NULL
  AND (
    (read_at IS NOT NULL AND responded_at <= read_at) OR
    (sent_at IS NOT NULL AND responded_at <= sent_at)
  );
