
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const campaignSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  template_id: z.string().min(1, 'Template é obrigatório'),
  segments: z.array(z.string()).min(1, 'Selecione pelo menos um segmento'),
  scheduled_at: z.date().optional(),
  send_immediately: z.boolean().default(false),
});

const steps = [
  { id: 1, name: 'Informações Básicas', description: 'Nome e descrição da campanha' },
  { id: 2, name: 'Template', description: 'Escolha o template de mensagem' },
  { id: 3, name: 'Segmentação', description: 'Selecione o público-alvo' },
  { id: 4, name: 'Agendamento', description: 'Configure quando enviar' },
  { id: 5, name: 'Revisão', description: 'Confirme os detalhes' },
];

const segments = [
  { id: 'eleitores', name: 'Eleitores', count: 4800 },
  { id: 'apoiadores', name: 'Apoiadores', count: 3200 },
  { id: 'liderancas', name: 'Lideranças', count: 2100 },
  { id: 'midia', name: 'Mídia', count: 890 },
  { id: 'empresarios', name: 'Empresários', count: 675 }
];

export const CampaignWizard = ({ isOpen, onClose }: CampaignWizardProps) => {
  const { organization } = useAuth();
  const { templates } = useTemplates();
  const { createCampaign } = useCampaigns();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      template_id: '',
      segments: [],
      send_immediately: false,
    },
  });

  const watchedValues = form.watch();
  const selectedTemplate = templates.find(t => t.id === watchedValues.template_id);
  const selectedSegments = segments.filter(s => watchedValues.segments.includes(s.id));
  const totalContacts = selectedSegments.reduce((acc, s) => acc + s.count, 0);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (values: z.infer<typeof campaignSchema>) => {
    if (!organization?.id) {
      toast.error('Organização não encontrada');
      return;
    }

    try {
      const campaignData = {
        name: values.name,
        description: values.description,
        template_id: values.template_id,
        target_contacts: { segments: values.segments },
        scheduled_at: values.send_immediately ? null : selectedDate?.toISOString(),
        status: values.send_immediately ? 'active' : 'scheduled',
        organization_id: organization.id,
        metrics: { sent: 0, delivered: 0, read: 0, failed: 0 },
      };

      await createCampaign.mutateAsync(campaignData);
      onClose();
      form.reset();
      setCurrentStep(1);
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return form.getValues('name').length > 0;
      case 2:
        return form.getValues('template_id').length > 0;
      case 3:
        return form.getValues('segments').length > 0;
      case 4:
        return form.getValues('send_immediately') || selectedDate;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Campanha *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Convite Evento Janeiro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o objetivo da campanha..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="template_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selecione um Template *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{template.name}</span>
                            <span className="text-sm text-slate-500">{template.category}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Preview do Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm bg-slate-50 p-3 rounded">
                    {selectedTemplate.content.substring(0, 200)}...
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedTemplate.variables?.map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="segments"
              render={() => (
                <FormItem>
                  <FormLabel>Selecione o Público-Alvo *</FormLabel>
                  <div className="grid grid-cols-1 gap-3">
                    {segments.map(segment => (
                      <FormField
                        key={segment.id}
                        control={form.control}
                        name="segments"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 border rounded-lg p-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(segment.id)}
                                onCheckedChange={(checked) => {
                                  const currentSegments = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentSegments, segment.id]);
                                  } else {
                                    field.onChange(currentSegments.filter(s => s !== segment.id));
                                  }
                                }}
                              />
                            </FormControl>
                            <div className="flex-1">
                              <FormLabel className="font-medium">
                                {segment.name}
                              </FormLabel>
                              <p className="text-sm text-slate-500">
                                {segment.count.toLocaleString()} contatos
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedSegments.length > 0 && (
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total de Contatos:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {totalContacts.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="send_immediately"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 border rounded-lg p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="font-medium">Enviar Imediatamente</FormLabel>
                    <p className="text-sm text-slate-500">
                      A campanha será iniciada assim que for criada
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {!watchedValues.send_immediately && (
              <div className="space-y-4">
                <div>
                  <FormLabel>Data e Hora do Envio</FormLabel>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input type="time" defaultValue="09:00" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revisão da Campanha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong>Nome:</strong> {watchedValues.name}
                </div>
                {watchedValues.description && (
                  <div>
                    <strong>Descrição:</strong> {watchedValues.description}
                  </div>
                )}
                <div>
                  <strong>Template:</strong> {selectedTemplate?.name}
                </div>
                <div>
                  <strong>Público-alvo:</strong> {selectedSegments.map(s => s.name).join(', ')}
                </div>
                <div>
                  <strong>Total de contatos:</strong> {totalContacts.toLocaleString()}
                </div>
                <div>
                  <strong>Agendamento:</strong> {
                    watchedValues.send_immediately 
                      ? 'Envio imediato' 
                      : selectedDate ? format(selectedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não definido'
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Campanha</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <div className="text-xs text-center mt-1">
                <div className="font-medium">{step.name}</div>
                <div className="text-slate-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`absolute h-px bg-slate-300 ${
                  currentStep > step.id ? 'bg-blue-600' : ''
                }`} style={{ 
                  left: `${((index + 1) * 20)}%`, 
                  width: '20%', 
                  top: '16px',
                  zIndex: -1 
                }} />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderStepContent()}

            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!validateCurrentStep()}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit"
                  disabled={createCampaign.isPending || !validateCurrentStep()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createCampaign.isPending ? 'Criando...' : 'Criar Campanha'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
