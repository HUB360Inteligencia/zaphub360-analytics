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
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAdminOrganizations } from '@/hooks/useAdminOrganizations';

const userInviteSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  organization_id: z.string().min(1, 'Selecione uma organização'),
  role: z.enum(['saas_admin', 'client', 'manager', 'agent', 'viewer', 'guest'])
});

type UserInviteFormValues = z.infer<typeof userInviteSchema>;

interface UserInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserInviteModal = ({ open, onOpenChange }: UserInviteModalProps) => {
  const { sendInvite } = useAdminUsers();
  const { organizations } = useAdminOrganizations();

  const form = useForm<UserInviteFormValues>({
    resolver: zodResolver(userInviteSchema),
    defaultValues: {
      email: '',
      full_name: '',
      organization_id: '',
      role: 'guest'
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        email: '',
        full_name: '',
        organization_id: '',
        role: 'guest'
      });
    }
  }, [open, form]);

  const onSubmit = async (data: UserInviteFormValues) => {
    try {
      await sendInvite.mutateAsync({
        email: data.email,
        organization_id: data.organization_id,
        role: data.role
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
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
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
          <DialogDescription>
            Envie um convite para um novo usuário acessar o sistema
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="usuario@empresa.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      {organizations
                        ?.filter((org) => org.is_active)
                        .map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={sendInvite.isPending}>
                Enviar Convite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
