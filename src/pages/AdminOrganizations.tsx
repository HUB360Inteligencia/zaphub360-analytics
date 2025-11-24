import { useState } from 'react';
import { useAdminOrganizations } from '@/hooks/useAdminOrganizations';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminOrganizations = () => {
  const { organizations, isLoading, deleteOrganization, updateOrganization } =
    useAdminOrganizations();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    updateOrganization.mutate({
      id,
      data: { is_active: !currentStatus }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organizações</h1>
          <p className="text-muted-foreground">Gerencie todas as organizações da plataforma</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Organização
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uso</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations?.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground">{org.slug}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{org.plan?.display_name || 'Sem plano'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={org.is_active ? 'default' : 'secondary'}>
                    {org.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>
                      Contatos: {org.usage_stats?.contacts_count || 0}
                      {org.plan?.max_contacts && ` / ${org.plan.max_contacts}`}
                    </p>
                    <p>
                      Eventos: {org.usage_stats?.events_count || 0}
                      {org.plan?.max_events && ` / ${org.plan.max_events}`}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(org.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(org.id, org.is_active)}
                    >
                      {org.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(org.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta organização? Esta ação não pode ser
              desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteOrganization.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminOrganizations;
