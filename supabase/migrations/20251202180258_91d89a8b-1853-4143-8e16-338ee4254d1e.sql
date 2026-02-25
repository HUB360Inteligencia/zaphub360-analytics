-- Adicionar coluna slug na tabela campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS slug text;

-- Criar função para gerar slug único para campanhas
CREATE OR REPLACE FUNCTION generate_campaign_slug(campaign_name text, org_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  base_slug := slugify_text(campaign_name);
  final_slug := base_slug;
  
  WHILE EXISTS (
    SELECT 1 FROM campaigns 
    WHERE organization_id = org_id AND slug = final_slug
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Popular slugs existentes com base no nome
UPDATE campaigns 
SET slug = generate_campaign_slug(name, organization_id) 
WHERE slug IS NULL;

-- Criar índice único para slug + organization_id
CREATE UNIQUE INDEX IF NOT EXISTS campaigns_org_slug_idx ON campaigns(organization_id, slug);

-- Tornar NOT NULL após popular
ALTER TABLE campaigns ALTER COLUMN slug SET NOT NULL;