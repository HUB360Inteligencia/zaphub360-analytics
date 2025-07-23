-- Migração das categorias para o novo sistema ZapHub
-- Atualizar categorias existentes para o novo formato

-- Mapear categorias antigas para as novas
UPDATE public.message_templates 
SET category = CASE 
  WHEN LOWER(category) IN ('vendas', 'venda') THEN 'campanha-mensagens'
  WHEN LOWER(category) IN ('marketing', 'promocao', 'promocional') THEN 'newsletter'
  WHEN LOWER(category) IN ('suporte', 'atendimento', 'help') THEN 'automacoes'
  WHEN LOWER(category) IN ('eventos', 'evento', 'convite') THEN 'convite-evento'
  ELSE 'campanha-mensagens' -- Default para categoria não mapeada
END
WHERE category IS NOT NULL;

-- Definir categoria padrão para templates sem categoria
UPDATE public.message_templates 
SET category = 'campanha-mensagens'
WHERE category IS NULL OR category = '';

-- Criar índice para melhor performance de filtros por categoria
CREATE INDEX IF NOT EXISTS idx_message_templates_category_organization 
ON public.message_templates(category, organization_id);

-- Adicionar constraint para validar as novas categorias
ALTER TABLE public.message_templates 
DROP CONSTRAINT IF EXISTS check_valid_category;

ALTER TABLE public.message_templates 
ADD CONSTRAINT check_valid_category 
CHECK (category IN ('newsletter', 'convite-evento', 'campanha-mensagens', 'automacoes'));