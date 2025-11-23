import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useEvent } from '@/hooks/useEvents';
import { useEventCheckin, CheckinFormData } from '@/hooks/useEventCheckin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const checkinSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  celular: z.string()
    .min(10, 'Celular deve ter no mínimo 10 dígitos')
    .max(15, 'Celular deve ter no máximo 15 dígitos')
    .regex(/^[0-9]+$/, 'Apenas números'),
  bairro: z.string().max(100).optional(),
  cidade: z.string().max(100).optional(),
  cargo: z.string().max(100).optional(),
  data_aniversario_text: z.string()
    .regex(/^(\d{4}|\d{8})?$/, 'Formato inválido (use ddmm ou ddmmaaaa)')
    .optional()
    .or(z.literal('')),
});

export default function EventCheckin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: event, isLoading: isLoadingEvent } = useEvent(id!);
  const { hasPermission, isLoadingPermission, performCheckin } = useEventCheckin(id!);

  const form = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      nome: '',
      celular: '',
      bairro: '',
      cidade: '',
      cargo: '',
      data_aniversario_text: '',
    },
  });

  useEffect(() => {
    if (!isLoadingPermission && !hasPermission) {
      navigate(`/events/${id}`);
    }
  }, [hasPermission, isLoadingPermission, navigate, id]);

  const onSubmit = async (data: CheckinFormData) => {
    await performCheckin.mutateAsync(data);
    setShowSuccess(true);
    form.reset();
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (isLoadingEvent || isLoadingPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Evento não encontrado</CardTitle>
            <CardDescription>O evento que você está procurando não existe.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/events')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Eventos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(`/events/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check-in: {event.name}</CardTitle>
            <CardDescription className="space-y-2">
              {event.event_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </div>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {showSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Check-in realizado com sucesso!</p>
                  <p className="text-sm text-green-700">O contato receberá uma mensagem em breve.</p>
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="5541999998888" 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input placeholder="Bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo/Função</FormLabel>
                      <FormControl>
                        <Input placeholder="Cargo ou função" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_aniversario_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Aniversário</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1234 (ddmm) ou 12341990 (ddmmaaaa)" 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                          maxLength={8}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={performCheckin.isPending}
                >
                  {performCheckin.isPending ? 'Processando...' : 'Realizar Check-in'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
