import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Users, MessageCircle, Settings, Send } from 'lucide-react';

export default function CampaignForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organization } = useAuth();
  const { templates } = useTemplates();
  const { createCampaign } = useCampaigns();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<ContactWithDetails[]>([]);
  const [selectedInstances, setSelectedInstances] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_id: '',
    intervalo_minimo: 30,
    intervalo_maximo: 60,
    horario_disparo_inicio: '09:00',
    horario_disparo_fim: '20:00',
    status: 'draft' as const,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization?.id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive"
      });
      return;
    }

    if (selectedContacts.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um contato para a campanha",
        variant: "destructive"
      });
      return;
    }

    if (selectedInstances.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma instância para envio",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
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
        tipo_conteudo: ['texto'],
        total_mensagens: 0,
        mensagens_enviadas: 0,
        mensagens_lidas: 0,
        mensagens_respondidas: 0,
      };

      const result = await createCampaign.mutateAsync(campaignData);

      // Associar instâncias à campanha
      if (result?.id && selectedInstances.length > 0) {
        const instanceAssociations = selectedInstances.map((instance, index) => ({
          id_campanha: result.id,
          id_instancia: instance.id,
          prioridade: index
        }));

        // Inserir associações na tabela campanha_instancia
        const { error: instanceError } = await supabase
          .from('campanha_instancia')
          .insert(instanceAssociations);

        if (instanceError) {
          console.error('Erro ao associar instâncias:', instanceError);
          toast({
            title: "Atenção",
            description: "Campanha criada, mas houve erro ao associar instâncias",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Sucesso",
        description: "Campanha criada com sucesso!",
      });
      
      navigate('/campaigns');
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar campanha. Tente novamente.",
        variant: "destructive"
      });
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
              <Label htmlFor="template">Template de Mensagem</Label>
              <Select value={formData.template_id} onValueChange={(value) => handleInputChange('template_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            />
          </CardContent>
        </Card>

        {/* Seleção de Instâncias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Instâncias de Envio
            </CardTitle>
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
                  disabled={isSubmitting || selectedContacts.length === 0 || selectedInstances.length === 0}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    "Criando..."
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