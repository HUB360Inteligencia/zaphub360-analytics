
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContactPhotoUploadProps {
  contactId: string;
  currentAvatarUrl?: string;
  onClose: () => void;
  onUploadSuccess: (avatarUrl: string) => void;
}

const ContactPhotoUpload = ({
  contactId,
  currentAvatarUrl,
  onClose,
  onUploadSuccess,
}: ContactPhotoUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas imagens.');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Gerar nome único para o arquivo
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${contactId}-${Date.now()}.${fileExt}`;

      // Upload para o bucket contact-avatars
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contact-avatars')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('contact-avatars')
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;

      // Atualizar o contato com a nova URL
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ avatar_url: avatarUrl })
        .eq('id', contactId);

      if (updateError) {
        throw updateError;
      }

      // Remover foto anterior se existir
      if (currentAvatarUrl) {
        const oldFileName = currentAvatarUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('contact-avatars')
            .remove([oldFileName]);
        }
      }

      toast.success('Foto atualizada com sucesso!');
      onUploadSuccess(avatarUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentAvatarUrl) return;

    setIsUploading(true);
    try {
      // Atualizar o contato removendo a URL da foto
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ avatar_url: null })
        .eq('id', contactId);

      if (updateError) {
        throw updateError;
      }

      // Remover arquivo do storage
      const fileName = currentAvatarUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('contact-avatars')
          .remove([fileName]);
      }

      toast.success('Foto removida com sucesso!');
      onUploadSuccess('');
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Erro ao remover foto');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Foto do Contato</DialogTitle>
          <DialogDescription>
            Faça upload de uma nova foto ou remova a foto atual
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview da foto atual ou selecionada */}
          <div className="flex justify-center">
            <Avatar className="h-32 w-32">
              <AvatarImage src={preview || currentAvatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                <Upload className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Seleção de arquivo */}
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button variant="outline" className="w-full cursor-pointer" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Nova Foto
                  </span>
                </Button>
              </label>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              {selectedFile && (
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? 'Enviando...' : 'Salvar Foto'}
                </Button>
              )}

              {currentAvatarUrl && !selectedFile && (
                <Button
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  {isUploading ? 'Removendo...' : 'Remover Foto'}
                </Button>
              )}

              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>

          {/* Informações */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Formatos aceitos: JPG, PNG, GIF</p>
            <p>• Tamanho máximo: 5MB</p>
            <p>• Recomendado: 400x400 pixels</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactPhotoUpload;
