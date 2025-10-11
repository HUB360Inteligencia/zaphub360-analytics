import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const requestSchema = z.object({
  fullName: z.string().min(2, 'Informe seu nome'),
  email: z.string().email('Email inválido'),
  organizationName: z.string().optional(),
  message: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

const AccessRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      fullName: '',
      email: '',
      organizationName: '',
      message: '',
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('access_requests')
        .insert({
          email: data.email,
          full_name: data.fullName,
          organization_name: data.organizationName || null,
          message: data.message || null,
        });
      if (error) throw error;
      toast.success('Solicitação enviada! Entraremos em contato em breve.');
      form.reset();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Solicitar Acesso</CardTitle>
          <CardDescription>
            Preencha seus dados para solicitar acesso à plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField name="fullName" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="email" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="organizationName" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Minha Empresa Ltda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="message" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Conte-nos brevemente sobre seu caso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Solicitação
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessRequest;