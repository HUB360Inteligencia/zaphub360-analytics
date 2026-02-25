import { useState } from 'react';
import { useAdminUsers, AdminUser } from '@/hooks/useAdminUsers';
import { Button } from '@/components/ui/button';
import { UserInviteModal } from '@/components/admin/UserInviteModal';
import { UserEditModal } from '@/components/admin/UserEditModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminUsers = () => {
  const { users, isLoading } = useAdminUsers();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'saas_admin':
        return 'destructive';
      case 'client':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      saas_admin: 'Admin SaaS',
      client: 'Cliente',
      manager: 'Gerente',
      agent: 'Agente',
      viewer: 'Visualizador',
      guest: 'Convidado'
    };
    return labels[role || 'guest'] || 'Sem role';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Gerencie todos os usuários da plataforma</p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Convidar Usuário
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Organização</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Login</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="font-medium">{user.full_name || 'Sem nome'}</p>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.organization ? (
                    <div>
                      <p className="font-medium">{user.organization.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.organization.slug}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sem organização</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.last_login_at
                    ? format(new Date(user.last_login_at), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR
                      })
                    : 'Nunca'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setEditModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserInviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />

      <UserEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={selectedUser || undefined}
      />
    </div>
  );
};

export default AdminUsers;
