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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAdminPlans } from '@/hooks/useAdminPlans';
import { useAdminOrganizations, Organization } from '@/hooks/useAdminOrganizations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const planChangeSchema = z.object({
  new_plan_id: z.string().min(1, 'Selecione um plano'),
  plan_expires_at: z.date().optional()
});

type PlanChangeFormValues = z.infer<typeof planChangeSchema>;

interface PlanChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization?: Organization;
}

export const PlanChangeModal = ({
  open,
  onOpenChange,
  organization
}: PlanChangeModalProps) => {
  const { plans } = useAdminPlans();
  const { changePlan } = useAdminOrganizations();

  const form = useForm<PlanChangeFormValues>({
    resolver: zodResolver(planChangeSchema),
    defaultValues: {
      new_plan_id: '',
      plan_expires_at: undefined
    }
  });

  useEffect(() => {
    if (organization && open) {
      form.reset({
        new_plan_id: organization.plan_id || '',
        plan_expires_at: organization.plan_expires_at
          ? new Date(organization.plan_expires_at)
          : undefined
      });
    }
  }, [organization, open, form]);

  const selectedPlanId = form.watch('new_plan_id');
  const newPlan = plans?.find((p) => p.id === selectedPlanId);
  const currentPlan = plans?.find((p) => p.id === organization?.plan_id);

  const hasExceededLimits =
    newPlan &&
    organization?.usage_stats &&
    ((newPlan.max_contacts &&
      (organization.usage_stats as any).contacts_count > newPlan.max_contacts) ||
      (newPlan.max_events &&
        (organization.usage_stats as any).events_count > newPlan.max_events) ||
      (newPlan.max_instances &&
        (organization.usage_stats as any).instances_count > newPlan.max_instances));

  const onSubmit = async (data: PlanChangeFormValues) => {
    if (!organization || hasExceededLimits) return;

    try {
      await changePlan.mutateAsync({
        organizationId: organization.id,
        planId: data.new_plan_id,
        expiresAt: data.plan_expires_at?.toISOString()
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Alterar Plano</DialogTitle>
          <DialogDescription>
            Atualize o plano de assinatura da organização
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {currentPlan && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Plano Atual</p>
                <p className="text-lg font-semibold">{currentPlan.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  R$ {currentPlan.price_monthly}/mês
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="new_plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo Plano</FormLabel>
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

            {newPlan && currentPlan && newPlan.id !== currentPlan.id && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Comparativo de Limites</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium">Recurso</div>
                  <div className="text-center">Atual</div>
                  <div className="text-center">Novo</div>

                  <div>Contatos</div>
                  <div className="text-center">{currentPlan.max_contacts || '∞'}</div>
                  <div className="text-center">{newPlan.max_contacts || '∞'}</div>

                  <div>Eventos</div>
                  <div className="text-center">{currentPlan.max_events || '∞'}</div>
                  <div className="text-center">{newPlan.max_events || '∞'}</div>

                  <div>Instâncias</div>
                  <div className="text-center">{currentPlan.max_instances || '∞'}</div>
                  <div className="text-center">{newPlan.max_instances || '∞'}</div>
                </div>
              </div>
            )}

            {hasExceededLimits && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Limite Excedido</AlertTitle>
                <AlertDescription>
                  A organização está usando mais recursos do que o novo plano permite.
                  Reduza o uso atual antes de alterar o plano.
                </AlertDescription>
              </Alert>
            )}

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
                  <FormDescription>
                    Deixe em branco para plano sem data de expiração
                  </FormDescription>
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
              <Button
                type="submit"
                disabled={changePlan.isPending || hasExceededLimits}
              >
                Alterar Plano
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
