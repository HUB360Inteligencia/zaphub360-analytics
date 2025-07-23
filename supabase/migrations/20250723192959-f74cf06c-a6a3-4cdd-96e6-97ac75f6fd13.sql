-- Reestruturação da tabela message_templates para EVO API
-- Adicionar novos campos para diferentes tipos de conteúdo

ALTER TABLE public.message_templates 
ADD COLUMN tipo_conteudo text[] DEFAULT ARRAY['texto'::text],
ADD COLUMN media_url text,
ADD COLUMN media_type text,
ADD COLUMN media_name text,
ADD COLUMN caption text,
ADD COLUMN latitude decimal(10,8),
ADD COLUMN longitude decimal(11,8),
ADD COLUMN botoes jsonb,
ADD COLUMN contato_nome text,
ADD COLUMN contato_numero text,
ADD COLUMN mensagem_extra text;

-- Atualizar registros existentes para ter tipo_conteudo = ['texto']
UPDATE public.message_templates 
SET tipo_conteudo = ARRAY['texto'::text] 
WHERE tipo_conteudo IS NULL;

-- Criar índices para melhor performance
CREATE INDEX idx_message_templates_tipo_conteudo ON public.message_templates USING GIN(tipo_conteudo);
CREATE INDEX idx_message_templates_organization_tipo ON public.message_templates(organization_id, tipo_conteudo);

-- Adicionar constraint para validar tipos de conteúdo válidos
ALTER TABLE public.message_templates 
ADD CONSTRAINT check_tipo_conteudo_valido 
CHECK (tipo_conteudo <@ ARRAY['texto', 'imagem', 'video', 'audio', 'localizacao', 'botoes', 'contato', 'documento']::text[]);

-- Adicionar constraint para validar botoes JSON quando tipo é 'botoes'
ALTER TABLE public.message_templates 
ADD CONSTRAINT check_botoes_quando_tipo_botoes 
CHECK (
  CASE 
    WHEN 'botoes' = ANY(tipo_conteudo) THEN botoes IS NOT NULL
    ELSE true
  END
);

-- Adicionar constraint para validar mídia quando tipo tem mídia
ALTER TABLE public.message_templates 
ADD CONSTRAINT check_media_quando_tipo_media 
CHECK (
  CASE 
    WHEN tipo_conteudo && ARRAY['imagem', 'video', 'audio', 'documento']::text[] 
    THEN media_url IS NOT NULL AND media_type IS NOT NULL
    ELSE true
  END
);

-- Adicionar constraint para validar localização quando tipo é localização
ALTER TABLE public.message_templates 
ADD CONSTRAINT check_localizacao_quando_tipo_localizacao 
CHECK (
  CASE 
    WHEN 'localizacao' = ANY(tipo_conteudo) 
    THEN latitude IS NOT NULL AND longitude IS NOT NULL
    ELSE true
  END
);