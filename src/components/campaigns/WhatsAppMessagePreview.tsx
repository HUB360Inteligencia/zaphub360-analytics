import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Play, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppMessagePreviewProps {
  message: string;
  mediaType?: string;
  mediaUrl?: string;
  mediaName?: string;
  mimeType?: string;
}

const WhatsAppMessagePreview = ({ 
  message, 
  mediaType, 
  mediaUrl, 
  mediaName,
  mimeType 
}: WhatsAppMessagePreviewProps) => {
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);

  const renderMedia = (isFullSize = false) => {
    if (!mediaUrl) return null;

    const containerClass = isFullSize ? "w-full max-w-2xl mx-auto" : "w-full max-w-xs";
    
    switch (mediaType) {
      case 'image':
        return (
          <div className={`${containerClass} relative group`}>
            <img
              src={mediaUrl}
              alt="Imagem da mensagem"
              className={`w-full rounded-lg object-cover ${isFullSize ? 'max-h-[70vh]' : 'max-h-48'}`}
              style={{ objectFit: 'cover' }}
            />
            {!isFullSize && (
              <div 
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                onClick={() => setIsMediaDialogOpen(true)}
              >
                <Eye className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className={`${containerClass} relative`}>
            <video
              src={mediaUrl}
              controls={isFullSize}
              className={`w-full rounded-lg ${isFullSize ? 'max-h-[70vh]' : 'max-h-48'}`}
              style={{ objectFit: 'cover' }}
              poster={mediaUrl} // Use the same URL as poster for now
            >
              Seu navegador não suporta vídeos HTML5.
            </video>
            {!isFullSize && (
              <div 
                className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center cursor-pointer hover:bg-opacity-40 transition-all"
                onClick={() => setIsMediaDialogOpen(true)}
              >
                <div className="bg-white bg-opacity-90 rounded-full p-3">
                  <Play className="w-8 h-8 text-gray-800 ml-1" />
                </div>
              </div>
            )}
          </div>
        );
      
      case 'audio':
        return (
          <div className={`${containerClass} bg-green-100 p-4 rounded-lg border border-green-200`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Áudio</p>
                <p className="text-xs text-gray-600">{mediaName || 'audio.mp3'}</p>
              </div>
            </div>
            {isFullSize && (
              <audio controls className="w-full mt-3">
                <source src={mediaUrl} type={mimeType || 'audio/mpeg'} />
                Seu navegador não suporta áudio HTML5.
              </audio>
            )}
          </div>
        );
      
      case 'document':
        return (
          <div className={`${containerClass} bg-blue-50 p-4 rounded-lg border border-blue-200`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {mediaName || 'documento.pdf'}
                </p>
                <p className="text-xs text-gray-600">Documento</p>
              </div>
              {isFullSize && (
                <Button variant="outline" size="sm" asChild>
                  <a href={mediaUrl} download={mediaName} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </a>
                </Button>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      {/* WhatsApp message bubble */}
      <div className="bg-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
        {/* Media content */}
        {mediaUrl && (
          <div className="mb-3">
            {renderMedia()}
          </div>
        )}
        
        {/* Text content */}
        {message && (
          <div className="text-sm text-gray-800 whitespace-pre-wrap">
            {message}
          </div>
        )}
        
        {/* Message timestamp */}
        <div className="flex justify-end mt-2">
          <div className="text-xs text-gray-500">
            {new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            <span className="ml-1">✓✓</span>
          </div>
        </div>
      </div>

      {/* Media preview dialog */}
      {mediaUrl && mediaType && (
        <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
          <DialogContent className="max-w-4xl w-full p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Visualização da Mídia</h3>
              {renderMedia(true)}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WhatsAppMessagePreview;