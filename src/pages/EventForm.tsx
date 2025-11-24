import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Eye, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { InstanceSelector } from '@/components/campaigns/InstanceSelector';
import { PositionManager } from '@/components/events/PositionManager';
import { toast } from 'sonner';

const eventSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  event_id: z.string().min(1, 'ID do evento é obrigatório'),
  location: z.string().optional(),
  event_date: z.string().optional(),
  message_text: z.string().min(1, 'Texto da mensagem é obrigatório'),
  webhook_url: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

const EventForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const { organization } = useAuth();
  const { events, createEvent, updateEvent, uploadEventImage, getEventInstances, syncEventInstances, isLoading: eventsLoading } = useEvents();
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
  const [allowedPositions, setAllowedPositions] = useState<string[]>([]);
  const [restrictPositions, setRestrictPositions] = useState(false);

  const currentEvent = isEditing ? events.find(e => e.id === id) : null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      event_id: '',
      location: '',
      event_date: '',
      message_text: '',
      webhook_url: '',
    }
  });

  useEffect(() => {
    if (currentEvent) {
      setValue('name', currentEvent.name);
      setValue('event_id', currentEvent.event_id);
      setValue('location', currentEvent.location || '');
      setValue('event_date', currentEvent.event_date ? format(new Date(currentEvent.event_date), "yyyy-MM-dd'T'HH:mm") : '');
      setValue('message_text', currentEvent.message_text);
      setValue('webhook_url', (currentEvent as any).webhook_url || '');
      
      // Load position settings
      setAllowedPositions((currentEvent as any).allowed_positions || []);
      setRestrictPositions((currentEvent as any).restrict_positions || false);
      
      if (currentEvent.message_image) {
        setImagePreview(currentEvent.message_image);
      }
    }
  }, [currentEvent, setValue]);

  // Separate effect for loading instances to avoid dependency issues
  useEffect(() => {
    if (currentEvent?.id) {
      getEventInstances(currentEvent.id).then(instances => {
        setSelectedInstances(instances);
      });
    }
  }, [currentEvent?.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isMp4 = file.type === 'video/mp4';
      if (isImage || isMp4) {
        setSelectedImage(file);
        if (isImage) {
          const reader = new FileReader();
          reader.onload = (evt) => setImagePreview(evt.target?.result as string);
          reader.readAsDataURL(file);
        } else {
          // Vídeo: usar URL local para preview
          const objectUrl = URL.createObjectURL(file);
          setImagePreview(objectUrl);
        }
      } else {
        toast.error('Selecione uma imagem ou um vídeo .mp4');
      }
    }
  };

  const onSubmit = async (data: EventFormData) => {
    if (!organization?.id) {
      toast.error('Organização não encontrada');
      return;
    }

    if (selectedInstances.length === 0) {
      toast.error('Selecione pelo menos uma instância');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrl = currentEvent?.message_image;
      let imageFilename = currentEvent?.image_filename;
      let mimeType: string | null = (currentEvent as any)?.mime_type || null;
      let mediaType: string | null = (currentEvent as any)?.media_type || null;

      // Upload da mídia se uma nova foi selecionada
      if (selectedImage) {
        const uploadResult = await uploadEventImage(selectedImage, data.name);
        imageUrl = uploadResult.url;
        imageFilename = uploadResult.filename;

        if (selectedImage.type === 'video/mp4') {
          mimeType = 'video/mp4';
          mediaType = 'video';
        } else if (selectedImage.type.startsWith('image/')) {
          mimeType = 'image/png';
          mediaType = 'image';
        }
      }

      // Preparar dados do evento (sem instance_ids que será sincronizado separadamente)
      const eventData = {
        name: data.name,
        event_id: data.event_id,
        location: data.location || null,
        event_date: data.event_date ? new Date(data.event_date).toISOString() : null,
        message_text: data.message_text,
        organization_id: organization.id,
        message_image: imageUrl || null,
        image_filename: imageFilename || null,
        mime_type: mimeType,
        media_type: mediaType,
        webhook_url: data.webhook_url || null,
        allowed_positions: allowedPositions,
        restrict_positions: restrictPositions,
        status: 'draft' as const,
      };

      let eventId: string;
      if (isEditing) {
        const updatedEvent = await updateEvent.mutateAsync({ id: id!, ...eventData });
        eventId = updatedEvent.id;
      } else {
        // Criar evento sem instance_ids (será sincronizado após criação)
        const newEvent = await createEvent.mutateAsync(eventData);
        eventId = newEvent.id;
      }

      // Sync event instances
      await syncEventInstances(eventId, selectedInstances);

      navigate('/events');
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/events')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? 'Editar Evento' : 'Novo Evento'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Atualize as informações do seu evento' : 'Configure seu evento e mensagem de disparo'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações do Evento */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Informações do Evento</CardTitle>
              <CardDescription>Dados básicos do seu evento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Evento *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Ex: Workshop de Marketing Digital"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_id">ID do Evento *</Label>
                <Input
                  id="event_id"
                  {...register('event_id')}
                  placeholder="Ex: workshop-2024-01"
                  className={errors.event_id ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  ID único para identificar o evento. Será usado no link de disparo.
                </p>
                {errors.event_id && (
                  <p className="text-sm text-destructive">{errors.event_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local do Evento</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Ex: Centro de Convenções São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date">Data e Hora do Evento</Label>
                <Input
                  id="event_date"
                  type="datetime-local"
                  {...register('event_date')}
                />
              </div>

              <div className="space-y-2">
                <Label>Instâncias WhatsApp</Label>
                <InstanceSelector
                  selectedInstances={selectedInstances}
                  onInstancesChange={setSelectedInstances}
                  currentEventInstanceIds={currentEvent?.instance_ids || []}
                />
                <p className="text-xs text-muted-foreground">
                  Selecione as instâncias que serão usadas para enviar as mensagens
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook N8N</Label>
                <Input
                  id="webhook_url"
                  {...register('webhook_url')}
                  placeholder="https://webhook.n8n.cloud/webhook/..."
                />
                <p className="text-xs text-muted-foreground">
                  URL do webhook N8N que será disparado ao clicar no botão de trigger
                </p>
              </div>

              <div className="space-y-2">
                <PositionManager
                  value={allowedPositions}
                  restrictMode={restrictPositions}
                  onChange={(positions, restrict) => {
                    setAllowedPositions(positions);
                    setRestrictPositions(restrict);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {restrictPositions 
                    ? "🔒 Modo restrito: apenas cargos da lista serão aceitos no check-in."
                    : "🔓 Modo flexível: permite criar novos cargos durante o check-in."
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mensagem e Imagem */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Mensagem de Disparo</CardTitle>
              <CardDescription>Configure o conteúdo da mensagem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message_text">Texto da Mensagem *</Label>
                <Textarea
                  id="message_text"
                  {...register('message_text')}
                  placeholder="Escreva sua mensagem aqui..."
                  rows={6}
                  className={errors.message_text ? 'border-destructive' : ''}
                />
                {errors.message_text && (
                  <p className="text-sm text-destructive">{errors.message_text.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Imagem da Mensagem</Label>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*,video/mp4"
                      onChange={handleImageChange}
                    />
                  </div>
                  
                  {imagePreview && (
                    <div className="space-y-2">
                      <Label>Preview da Mídia</Label>
                      <div className="relative w-full max-w-md">
                        {selectedImage?.type === 'video/mp4' ? (
                          <video
                            src={imagePreview}
                            controls
                            className="w-full h-48 rounded-lg border border-border object-cover"
                          />
                        ) : (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg border border-border"
                          />
                        )}
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImagePreview('');
                            setSelectedImage(null);
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  O arquivo será salvo como {(watch('name')?.replace(/[^a-zA-Z0-9]/g, '_') || 'evento')}
                  {selectedImage?.type === 'video/mp4' ? '.mp4' : '.png'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview da Mensagem */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Preview da Mensagem
            </CardTitle>
            <CardDescription>Veja como sua mensagem ficará no WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm mx-auto bg-green-50 p-4 rounded-lg border border-green-200">
              {imagePreview && (
                selectedImage?.type === 'video/mp4' ? (
                  <video src={imagePreview} controls className="w-full h-32 object-cover rounded mb-3" />
                ) : (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                )
              )}
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {watch('message_text') || 'Sua mensagem aparecerá aqui...'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/events')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? 'Atualizar Evento' : 'Criar Evento'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;