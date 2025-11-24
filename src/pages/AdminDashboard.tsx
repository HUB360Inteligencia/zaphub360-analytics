import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminOrganizations } from '@/hooks/useAdminOrganizations';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Building2, Users, MessageSquare, TrendingUp, CreditCard, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { organizations, isLoading: loadingOrgs } = useAdminOrganizations();
  const { users, isLoading: loadingUsers } = useAdminUsers();

  const activeOrgs = organizations?.filter((org) => org.is_active).length || 0;
  const totalUsers = users?.length || 0;
  const totalMessages =
    organizations?.reduce(
      (sum, org) => sum + (org.usage_stats?.messages_sent_this_month || 0),
      0
    ) || 0;

  const stats = [
    {
      title: 'Organizações Ativas',
      value: activeOrgs,
      total: organizations?.length || 0,
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      title: 'Usuários Totais',
      value: totalUsers,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Mensagens (Mês)',
      value: totalMessages,
      icon: MessageSquare,
      color: 'text-purple-600'
    },
    {
      title: 'Taxa de Crescimento',
      value: '+12%',
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ];

  if (loadingOrgs || loadingUsers) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral da plataforma e métricas gerais
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const quickLinks = [
    {
      title: 'Organizações',
      description: 'Gerencie todas as organizações da plataforma',
      href: '/admin/organizations',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      count: organizations?.length || 0
    },
    {
      title: 'Usuários',
      description: 'Administre usuários e permissões',
      href: '/admin/users',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      count: totalUsers
    },
    {
      title: 'Planos',
      description: 'Configure planos e preços',
      href: '/admin/plans',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      count: '-'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Visão geral da plataforma e métricas gerais
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} to={link.href}>
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${link.bgColor}`}>
                      <Icon className={`h-6 w-6 ${link.color}`} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardTitle className="mt-4">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{link.count}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value}
                  {stat.total && (
                    <span className="text-sm text-muted-foreground ml-2">
                      / {stat.total}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organizações por Plano</CardTitle>
            <CardDescription>Distribuição de organizações por tipo de plano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['free', 'starter', 'professional', 'enterprise'].map((planName) => {
                const count =
                  organizations?.filter((org) => org.plan?.name === planName).length || 0;
                const percentage = organizations?.length
                  ? ((count / organizations.length) * 100).toFixed(0)
                  : 0;

                return (
                  <div key={planName} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{planName}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas organizações criadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organizations?.slice(0, 5).map((org) => (
                <div key={org.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                    {org.plan?.display_name || 'Sem plano'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
