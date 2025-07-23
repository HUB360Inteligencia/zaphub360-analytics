-- Criar bucket para mídias de conteúdo de mensagem
INSERT INTO storage.buckets (id, name, public) VALUES ('message-content-media', 'message-content-media', true);

-- Criar políticas para o bucket message-content-media
CREATE POLICY "Anyone can view media files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'message-content-media');

CREATE POLICY "Organization members can upload media files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'message-content-media' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Organization members can update their media files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'message-content-media' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Organization members can delete their media files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'message-content-media' AND 
  auth.uid() IS NOT NULL
);

-- Adicionar campo formato_id à tabela message_templates
ALTER TABLE public.message_templates 
ADD COLUMN formato_id text;