import { useAdminPlans } from '@/hooks/useAdminPlans';
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
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const AdminPlans = () => {
  const { plans, isLoading } = useAdminPlans();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const formatValue = (value?: number) => {
    return value === null || value === undefined ? '∞' : value.toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Planos</h1>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura da plataforma
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plano</TableHead>
              <TableHead>Preço/Mês</TableHead>
              <TableHead>Limites</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans?.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{plan.display_name}</p>
                    <p className="text-sm text-muted-foreground">{plan.name}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold">
                    R$ {plan.price_monthly.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    <p>Contatos: {formatValue(plan.max_contacts)}</p>
                    <p>Eventos: {formatValue(plan.max_events)}</p>
                    <p>Mensagens/mês: {formatValue(plan.max_messages_per_month)}</p>
                    <p>Instâncias: {formatValue(plan.max_instances)}</p>
                    <p>Usuários: {formatValue(plan.max_users)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminPlans;
