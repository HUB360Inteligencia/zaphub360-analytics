import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const PlanUsageCard = () => {
  const { organization } = useAuth();

  const { data: orgData, isLoading } = useQuery({
    queryKey: ['organization-usage', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('id', organization?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!orgData || !orgData.plan) {
    return null;
  }

  const plan = orgData.plan as any;
  const usage = orgData.usage_stats as any || {};

  const getPercentage = (current: number, max?: number) => {
    if (!max) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const formatLimit = (value?: number) => {
    return value === null || value === undefined ? '∞' : value.toLocaleString('pt-BR');
  };

  const usageItems = [
    {
      label: 'Contatos',
      current: usage.contacts_count || 0,
      max: plan.max_contacts,
      color: 'bg-blue-500'
    },
    {
      label: 'Eventos',
      current: usage.events_count || 0,
      max: plan.max_events,
      color: 'bg-green-500'
    },
    {
      label: 'Mensagens (mês atual)',
      current: usage.messages_sent_this_month || 0,
      max: plan.max_messages_per_month,
      color: 'bg-purple-500'
    },
    {
      label: 'Instâncias',
      current: usage.instances_count || 0,
      max: plan.max_instances,
      color: 'bg-orange-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Plano: {plan.display_name}</CardTitle>
            <CardDescription>
              R$ {plan.price_monthly?.toFixed(2)} / mês
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {orgData.plan_expires_at && (
          <Alert>
            <AlertDescription>
              Plano válido até: {format(new Date(orgData.plan_expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {usageItems.map((item) => {
            const percentage = getPercentage(item.current, item.max);
            const isNearLimit = percentage >= 80;
            const isAtLimit = percentage >= 100;

            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className={isAtLimit ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                    {item.current} / {formatLimit(item.max)}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
                {isAtLimit && (
                  <p className="text-xs text-destructive">
                    Limite atingido. Entre em contato para fazer upgrade.
                  </p>
                )}
                {isNearLimit && !isAtLimit && (
                  <p className="text-xs text-orange-600">
                    Próximo do limite ({percentage.toFixed(0)}%)
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Recursos do plano:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {plan.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
