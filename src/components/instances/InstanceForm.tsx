import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Instance } from '@/hooks/useInstances';

const instanceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone_number: z.string().min(10, 'Número deve ter pelo menos 10 dígitos').regex(/^\+?[\d\s-()]+$/, 'Formato de número inválido'),
  api_url: z.string().url('URL deve ser válida').optional().or(z.literal('')),
  api_key: z.string().optional(),
  status: z.string(),
});

type InstanceFormData = z.infer<typeof instanceSchema>;

interface InstanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance?: Instance;
}

export function InstanceForm({ open, onOpenChange, instance }: InstanceFormProps) {
  const { toast } = useToast();
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<InstanceFormData>({
    resolver: zodResolver(instanceSchema),
    defaultValues: {
      name: instance?.name || '',
      phone_number: instance?.phone_number || '',
      api_url: instance?.api_url || '',
      api_key: '',
      status: instance?.status || 'inactive',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InstanceFormData) => {
      if (!organization?.id) throw new Error('Organização não encontrada');

      const instanceData = {
        name: data.name,
        phone_number: data.phone_number,
        api_url: data.api_url || null,
        api_key: data.api_key || null,
        status: data.status,
        organization_id: organization.id,
        updated_at: new Date().toISOString(),
      };

      if (instance) {
        const { data: result, error } = await supabase
          .from('instances')
          .update(instanceData)
          .eq('id', instance.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('instances')
          .insert(instanceData)
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      queryClient.invalidateQueries({ queryKey: ['active-instances'] });
      toast({
        title: instance ? 'Instância atualizada!' : 'Instância criada!',
        description: instance 
          ? 'A instância foi atualizada com sucesso.' 
          : 'A nova instância foi criada com sucesso.',
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Erro ao salvar instância:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar a instância. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InstanceFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {instance ? 'Editar Instância' : 'Nova Instância'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Instância</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: WhatsApp Vendas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: +55 11 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="api_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da API (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave da API (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={instance ? '••••••••' : 'Chave da API'} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending 
                  ? (instance ? 'Atualizando...' : 'Criando...') 
                  : (instance ? 'Atualizar' : 'Criar')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}