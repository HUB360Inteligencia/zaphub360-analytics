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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Upload, Eye, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEvents } from '@/hooks/useEvents';
import { useInstances } from '@/hooks/useInstances';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const eventSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  event_id: z.string().min(1, 'ID do evento é obrigatório'),
  location: z.string().optional(),
  event_date: z.string().optional(),
  instance_id: z.string().optional(),
  message_text: z.string().min(1, 'Texto da mensagem é obrigatório'),
});

type EventFormData = z.infer<typeof eventSchema>;

const EventForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const { organization } = useAuth();
  const { events, createEvent, updateEvent, uploadEventImage, isLoading: eventsLoading } = useEvents();
  const { instances, isLoading: instancesLoading } = useInstances();
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      instance_id: '',
      message_text: '',
    }
  });

  useEffect(() => {
    if (currentEvent) {
      setValue('name', currentEvent.name);
      setValue('event_id', currentEvent.event_id);
      setValue('location', currentEvent.location || '');
      setValue('event_date', currentEvent.event_date ? format(new Date(currentEvent.event_date), "yyyy-MM-dd'T'HH:mm") : '');
      setValue('instance_id', currentEvent.instance_id || '');
      setValue('message_text', currentEvent.message_text);
      
      if (currentEvent.message_image) {
        setImagePreview(currentEvent.message_image);
      }
    }
  }, [currentEvent, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        toast.error('Por favor, selecione apenas arquivos de imagem');
      }
    }
  };

  const onSubmit = async (data: EventFormData) => {
    if (!organization?.id) {
      toast.error('Organização não encontrada');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrl = currentEvent?.message_image;
      let imageFilename = currentEvent?.image_filename;

      // Upload da imagem se uma nova foi selecionada
      if (selectedImage) {
        const uploadResult = await uploadEventImage(selectedImage, data.name);
        imageUrl = uploadResult.url;
        imageFilename = uploadResult.filename;
      }

      const eventData = {
        name: data.name,
        event_id: data.event_id,
        location: data.location || null,
        event_date: data.event_date ? new Date(data.event_date).toISOString() : null,
        instance_id: data.instance_id || null,
        message_text: data.message_text,
        organization_id: organization.id,
        message_image: imageUrl || null,
        image_filename: imageFilename || null,
        status: 'draft' as const
      };

      if (isEditing) {
        await updateEvent.mutateAsync({ id: id!, ...eventData });
      } else {
        await createEvent.mutateAsync(eventData);
      }

      navigate('/events');
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (eventsLoading || instancesLoading) {
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
                <Label htmlFor="instance_id">Instância WhatsApp</Label>
                <Select onValueChange={(value) => setValue('instance_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma instância" />
                  </SelectTrigger>
                  <SelectContent>
                    {instances.map((instance) => (
                      <SelectItem key={instance.id} value={instance.id}>
                        {instance.name} ({instance.phone_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Instância do WhatsApp que será usada para enviar as mensagens
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
                  <div className="flex items-center gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  
                  {imagePreview && (
                    <div className="space-y-2">
                      <Label>Preview da Imagem</Label>
                      <div className="relative w-full max-w-md">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-border"
                        />
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
                  A imagem será salva como {watch('name')?.replace(/[^a-zA-Z0-9]/g, '_') || 'evento'}.png
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
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded mb-3"
                />
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