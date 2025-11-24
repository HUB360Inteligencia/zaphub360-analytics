import { useEffect } from 'react';
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
import { useAdminUsers, AdminUser } from '@/hooks/useAdminUsers';
import { useAdminOrganizations } from '@/hooks/useAdminOrganizations';

const userEditSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  organization_id: z.string().min(1, 'Selecione uma organização'),
  role: z.enum(['saas_admin', 'client', 'manager', 'agent', 'viewer', 'guest']),
  is_active: z.boolean()
});

type UserEditFormValues = z.infer<typeof userEditSchema>;

interface UserEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUser;
}

export const UserEditModal = ({ open, onOpenChange, user }: UserEditModalProps) => {
  const { updateUser } = useAdminUsers();
  const { organizations } = useAdminOrganizations();

  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      full_name: '',
      organization_id: '',
      role: 'guest',
      is_active: true
    }
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        full_name: user.full_name || '',
        organization_id: user.organization_id || '',
        role: user.role || 'guest',
        is_active: user.is_active
      });
    }
  }, [user, open, form]);

  const onSubmit = async (data: UserEditFormValues) => {
    if (!user) return;

    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          full_name: data.full_name,
          organization_id: data.organization_id,
          role: data.role,
          is_active: data.is_active
        }
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const roleLabels = {
    saas_admin: 'Admin SaaS',
    client: 'Cliente',
    manager: 'Gerente',
    agent: 'Agente',
    viewer: 'Visualizador',
    guest: 'Convidado'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Email</FormLabel>
              <Input value={user?.email} disabled />
              <p className="text-sm text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="João Silva" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organização</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma organização" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizations?.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name} {!org.is_active && '(Inativa)'}
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usuário Ativo</FormLabel>
                    <FormDescription>
                      Usuários inativos não podem acessar o sistema
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
