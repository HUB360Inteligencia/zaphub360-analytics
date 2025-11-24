import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAdminPlans } from '@/hooks/useAdminPlans';
import { useAdminOrganizations, Organization } from '@/hooks/useAdminOrganizations';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { slugify } from '@/lib/slugify';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const organizationSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  slug: z
    .string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  domain: z.string().url('URL inválida').optional().or(z.literal('')),
  plan_id: z.string().min(1, 'Selecione um plano'),
  is_active: z.boolean(),
  plan_expires_at: z.date().optional(),
  admin_email: z.string().email('Email inválido').optional().or(z.literal('')),
  admin_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional().or(z.literal(''))
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface OrganizationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization?: Organization;
  mode: 'create' | 'edit';
}

export const OrganizationFormModal = ({
  open,
  onOpenChange,
  organization,
  mode
}: OrganizationFormModalProps) => {
  const { plans } = useAdminPlans();
  const { createOrganization, updateOrganization, organizations } = useAdminOrganizations();
  const { sendInvite } = useAdminUsers();
  const [showAdminFields, setShowAdminFields] = useState(mode === 'create');

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      slug: '',
      domain: '',
      plan_id: '',
      is_active: true,
      admin_email: '',
      admin_name: ''
    }
  });

  useEffect(() => {
    if (organization && mode === 'edit') {
      form.reset({
        name: organization.name,
        slug: organization.slug,
        domain: organization.domain || '',
        plan_id: organization.plan_id || '',
        is_active: organization.is_active,
        plan_expires_at: organization.plan_expires_at
          ? new Date(organization.plan_expires_at)
          : undefined,
        admin_email: '',
        admin_name: ''
      });
    } else if (mode === 'create') {
      form.reset({
        name: '',
        slug: '',
        domain: '',
        plan_id: '',
        is_active: true,
        admin_email: '',
        admin_name: ''
      });
    }
  }, [organization, mode, form, open]);

  const onSubmit = async (data: OrganizationFormValues) => {
    try {
      if (mode === 'create') {
        // Criar organização
        const result = await createOrganization.mutateAsync({
          name: data.name,
          slug: data.slug,
          domain: data.domain || undefined,
          plan_id: data.plan_id,
          is_active: data.is_active,
          plan_expires_at: data.plan_expires_at?.toISOString()
        });

        // Se forneceu email do admin, enviar convite
        if (data.admin_email && data.admin_name && showAdminFields) {
          // Buscar a organização recém-criada pelo slug
          const newOrg = organizations?.find(org => org.slug === data.slug);
          
          if (newOrg) {
            await sendInvite.mutateAsync({
              email: data.admin_email,
              organization_id: newOrg.id,
              role: 'client',
              full_name: data.admin_name
            });
          }
        }
      } else {
        await updateOrganization.mutateAsync({
          id: organization!.id,
          data: {
            name: data.name,
            slug: data.slug,
            domain: data.domain || undefined,
            plan_id: data.plan_id,
            is_active: data.is_active,
            plan_expires_at: data.plan_expires_at?.toISOString()
          }
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar organização:', error);
    }
  };

  const handleNameChange = (value: string) => {
    form.setValue('name', value);
    if (mode === 'create') {
      form.setValue('slug', slugify(value));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nova Organização' : 'Editar Organização'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Crie uma nova organização e, opcionalmente, convide o primeiro administrador'
              : 'Atualize as informações da organização'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Organização</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Minha Empresa"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="minha-empresa" />
                  </FormControl>
                  <FormDescription>
                    URL amigável gerada automaticamente
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domínio (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://minhaempresa.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.display_name} - R$ {plan.price_monthly}/mês
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plan_expires_at"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Expiração (opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Organização Ativa</FormLabel>
                    <FormDescription>
                      Organizações inativas não podem acessar o sistema
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {mode === 'create' && (
              <>
                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Criar Primeiro Administrador</h4>
                      <p className="text-sm text-muted-foreground">
                        Envie um convite para o administrador da organização
                      </p>
                    </div>
                    <Switch
                      checked={showAdminFields}
                      onCheckedChange={setShowAdminFields}
                    />
                  </div>

                  {showAdminFields && (
                    <>
                      <FormField
                        control={form.control}
                        name="admin_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email do Administrador</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="admin@empresa.com"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="admin_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Administrador</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="João Silva" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createOrganization.isPending || updateOrganization.isPending}
              >
                {mode === 'create' ? 'Criar Organização' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
