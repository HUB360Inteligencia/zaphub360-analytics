-- First, make id_campanha nullable to allow events
ALTER TABLE public.campanha_instancia 
ALTER COLUMN id_campanha DROP NOT NULL;

-- Add id_evento column to campanha_instancia table
ALTER TABLE public.campanha_instancia 
ADD COLUMN id_evento uuid REFERENCES public.events(id) ON DELETE CASCADE;

-- Add constraint to ensure exactly one of id_campanha or id_evento is filled
ALTER TABLE public.campanha_instancia 
ADD CONSTRAINT check_campanha_or_evento 
CHECK (
  (id_campanha IS NOT NULL AND id_evento IS NULL) OR 
  (id_campanha IS NULL AND id_evento IS NOT NULL)
);

-- Create partial unique indexes to prevent duplicate associations
CREATE UNIQUE INDEX idx_campanha_instancia_unique_campanha 
ON public.campanha_instancia (id_campanha, id_instancia) 
WHERE id_campanha IS NOT NULL;

CREATE UNIQUE INDEX idx_campanha_instancia_unique_evento 
ON public.campanha_instancia (id_evento, id_instancia) 
WHERE id_evento IS NOT NULL;

-- Update RLS policies to handle both campaigns and events
DROP POLICY IF EXISTS "Users can manage campaign instances in their organization" ON public.campanha_instancia;
DROP POLICY IF EXISTS "Users can view campaign instances from their organization" ON public.campanha_instancia;

CREATE POLICY "Users can manage instances in their organization" 
ON public.campanha_instancia
FOR ALL
USING (
  (id_campanha IS NOT NULL AND EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campanha_instancia.id_campanha 
    AND c.organization_id = get_user_organization_id()
  )) OR
  (id_evento IS NOT NULL AND EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = campanha_instancia.id_evento 
    AND e.organization_id = get_user_organization_id()
  ))
);

CREATE POLICY "Users can view instances from their organization" 
ON public.campanha_instancia
FOR SELECT
USING (
  (id_campanha IS NOT NULL AND EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campanha_instancia.id_campanha 
    AND c.organization_id = get_user_organization_id()
  )) OR
  (id_evento IS NOT NULL AND EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = campanha_instancia.id_evento 
    AND e.organization_id = get_user_organization_id()
  ))
);

-- Migrate existing event instance_id to campanha_instancia
INSERT INTO public.campanha_instancia (id_evento, id_instancia, created_at)
SELECT 
  e.id as id_evento,
  e.instance_id as id_instancia,
  now() as created_at
FROM public.events e
WHERE e.instance_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.campanha_instancia ci 
  WHERE ci.id_evento = e.id AND ci.id_instancia = e.instance_id
);