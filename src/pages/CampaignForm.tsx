import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTemplates } from '@/hooks/useTemplates';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useAuth } from '@/contexts/AuthContext';
import { AdvancedContactSelector } from '@/components/campaigns/AdvancedContactSelector';
import { InstanceSelector } from '@/components/campaigns/InstanceSelector';
import { ContactWithDetails } from '@/hooks/useAdvancedContactFilter';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, MessageCircle, Settings, Send, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CampaignForm() {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const { templates } = useTemplates();
  const { createCampaign, activateCampaign } = useCampaigns();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<ContactWithDetails[]>([]);
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    message_text: '',
    url_media: '',
    name_media: '',
    mime_type: '',
    media_type: '',
    intervalo_minimo: 30,
    intervalo_maximo: 60,
    horario_disparo_inicio: '09:00',
    horario_disparo_fim: '20:00',
    status: 'draft' as 'draft' | 'active',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type === 'video/mp4';
      const isDocument = file.type === 'application/pdf';
      
      if (isImage || isVideo || isDocument) {
        setSelectedMedia(file);
        
        // Generate name_media based on campaign name - lowercase
        const baseName = (formData.name || 'campanha').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const extension = file.name.split('.').pop()?.toLowerCase();
        setFormData(prev => ({
          ...prev,
          name_media: `${baseName}.${extension}`,
          mime_type: file.type,
          media_type: isImage ? 'image' : isVideo ? 'video' : 'document'
        }));

        if (isImage || isVideo) {
          const reader = new FileReader();
          reader.onload = (evt) => setMediaPreview(evt.target?.result as string);
          reader.readAsDataURL(file);
        } else {
          setMediaPreview('');
        }
        } else {
          toast.error("Selecione uma imagem, vídeo .mp4 ou documento .pdf");
        }
    }
  };

  const uploadMedia = async (file: File, campaignName: string) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${campaignName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('message-content-media')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('message-content-media')
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      filename: fileName
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization?.id) {
      toast.error("Organização não encontrada");
      return;
    }

    if (selectedContacts.length === 0) {
      toast.error("Selecione pelo menos um contato para a campanha");
      return;
    }

    if (selectedInstances.length === 0) {
      toast.error("Selecione pelo menos uma instância para envio");
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl = formData.url_media;
      let mediaFilename = formData.name_media;

      // Upload da mídia se uma nova foi selecionada
      if (selectedMedia) {
        const uploadResult = await uploadMedia(selectedMedia, formData.name);
        mediaUrl = uploadResult.url;
        mediaFilename = uploadResult.filename;
      }

      // Criar a campanha
      const campaignData = {
        ...formData,
        organization_id: organization.id,
        target_contacts: {
          contacts: selectedContacts.map(contact => ({
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            email: contact.email
          }))
        },
        horario_disparo_inicio: formData.horario_disparo_inicio + ':00',
        horario_disparo_fim: formData.horario_disparo_fim + ':00',
        tipo_conteudo: selectedMedia ? [formData.media_type, 'texto'] : ['texto'],
        total_mensagens: selectedContacts.length,
        mensagens_enviadas: 0,
        mensagens_lidas: 0,
        mensagens_respondidas: 0,
        url_media: mediaUrl,
        name_media: mediaFilename,
      };

      const result = await createCampaign.mutateAsync(campaignData);

      // Associar instâncias à campanha
      if (result?.id && selectedInstances.length > 0) {
        const instanceAssociations = selectedInstances.map((instanceId, index) => ({
          id_campanha: result.id,
          id_instancia: instanceId,
          prioridade: index
        }));

        // Inserir associações na tabela campanha_instancia
        const { error: instanceError } = await supabase
          .from('campanha_instancia')
          .insert(instanceAssociations);

        if (instanceError) {
          console.error('Erro ao associar instâncias:', instanceError);
          toast.error("Campanha criada, mas houve erro ao associar instâncias");
        }
      }

      // Se status é 'active', iniciar disparo imediatamente
      if (formData.status === 'active' && selectedContacts.length > 0) {
        // Criar entradas na tabela mensagens_enviadas
        const messagePromises = selectedContacts.map(async (contact) => {
          const instanceId = selectedInstances[Math.floor(Math.random() * selectedInstances.length)];
          
          return supabase.from('mensagens_enviadas').insert({
            id_campanha: result.id,
            celular: contact.phone,
            nome_contato: contact.name,
             mensagem: formData.message_text,
            instancia_id: instanceId,
            organization_id: organization.id,
            status: 'fila',
            tipo_fluxo: 'campanha',
            url_media: mediaUrl || null,
            name_media: mediaFilename || null,
            mime_type: formData.mime_type || null,
            media_type: formData.media_type || null,
            caption_media: formData.message_text || null
          });
        });

        await Promise.all(messagePromises);
      }

      toast.success("Campanha criada com sucesso!");
      
      navigate('/campaigns');
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      toast.error("Erro ao criar campanha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Campanha</h1>
          <p className="text-muted-foreground">
            Configure uma nova campanha de mensagens WhatsApp
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informações da Campanha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Campanha *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Campanha Black Friday 2024"
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="scheduled">Agendada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o objetivo e detalhes da campanha..."
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="message_text">Texto da Mensagem *</Label>
              <Textarea
                id="message_text"
                value={formData.message_text}
                onChange={(e) => handleInputChange('message_text', e.target.value)}
                placeholder="Digite o texto da mensagem..."
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="intervalo_minimo">Intervalo Mínimo (min)</Label>
                <Input
                  id="intervalo_minimo"
                  type="number"
                  min="1"
                  max="300"
                  value={formData.intervalo_minimo}
                  onChange={(e) => handleInputChange('intervalo_minimo', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="intervalo_maximo">Intervalo Máximo (min)</Label>
                <Input
                  id="intervalo_maximo"
                  type="number"
                  min="1"
                  max="300"
                  value={formData.intervalo_maximo}
                  onChange={(e) => handleInputChange('intervalo_maximo', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="horario_inicio">Horário Início</Label>
                <Input
                  id="horario_inicio"
                  type="time"
                  value={formData.horario_disparo_inicio}
                  onChange={(e) => handleInputChange('horario_disparo_inicio', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="horario_fim">Horário Fim</Label>
                <Input
                  id="horario_fim"
                  type="time"
                  value={formData.horario_disparo_fim}
                  onChange={(e) => handleInputChange('horario_disparo_fim', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mensagem e Mídia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conteúdo da Mensagem
            </CardTitle>
            <CardDescription>Configure o texto e mídia da mensagem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="media">Mídia da Mensagem</Label>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Input
                    id="media"
                    type="file"
                    accept="image/*,video/mp4,application/pdf"
                    onChange={handleMediaChange}
                  />
                </div>
                
                {mediaPreview && (
                  <div className="space-y-2">
                    <Label>Preview da Mídia</Label>
                    <div className="relative w-full max-w-md">
                      {formData.media_type === 'video' ? (
                        <video
                          src={mediaPreview}
                          controls
                          className="w-full h-48 rounded-lg border border-border object-cover"
                        />
                      ) : formData.media_type === 'image' ? (
                        <img
                          src={mediaPreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-border"
                        />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center bg-muted rounded-lg border border-border">
                          <span className="text-sm text-muted-foreground">Documento PDF</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setMediaPreview('');
                          setSelectedMedia(null);
                          setFormData(prev => ({
                            ...prev,
                            media_type: '',
                            mime_type: '',
                            name_media: '',
                            url_media: ''
                          }));
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {formData.name_media && (
                <p className="text-xs text-muted-foreground">
                  O arquivo será salvo como: {formData.name_media}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message_text">Texto da Mensagem *</Label>
              <Textarea
                id="message_text"
                value={formData.message_text}
                onChange={(e) => handleInputChange('message_text', e.target.value)}
                placeholder="Digite o texto da mensagem..."
                className="min-h-[100px]"
                required
              />
            </div>

            {formData.name_media && (
              <p className="text-xs text-muted-foreground">
                O arquivo será salvo como: {formData.name_media}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Preview da Mensagem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview da Mensagem
            </CardTitle>
            <CardDescription>Veja como sua mensagem ficará no WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm mx-auto bg-green-50 p-4 rounded-lg border border-green-200">
              {mediaPreview && (
                formData.media_type === 'video' ? (
                  <video 
                    src={mediaPreview} 
                    controls 
                    className="w-full h-32 object-cover rounded mb-3" 
                  />
                ) : formData.media_type === 'image' ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                ) : formData.media_type === 'document' ? (
                  <div className="w-full h-16 flex items-center justify-center bg-muted rounded mb-3">
                    <span className="text-xs text-muted-foreground">📄 {formData.name_media}</span>
                  </div>
                ) : null
              )}
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {formData.message_text || 'Sua mensagem aparecerá aqui...'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Seleção de Contatos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Audiência da Campanha
            </CardTitle>
          </CardHeader>
          <CardContent>
              <AdvancedContactSelector
                selectedContacts={selectedContacts}
                onContactsChange={setSelectedContacts}
                useFiltersAsSelection={true}
              />
          </CardContent>
        </Card>

        {/* Seleção de Instâncias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Instâncias de Envio
            </CardTitle>
            <CardDescription>Selecione as instâncias WhatsApp para enviar as mensagens</CardDescription>
          </CardHeader>
          <CardContent>
            <InstanceSelector
              selectedInstances={selectedInstances}
              onInstancesChange={setSelectedInstances}
            />
          </CardContent>
        </Card>

        {/* Resumo e Ações */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>Resumo: {selectedContacts.length} contatos • {selectedInstances.length} instâncias</p>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/campaigns')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedContacts.length === 0 || selectedInstances.length === 0 || !formData.message_text}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Criar Campanha
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}