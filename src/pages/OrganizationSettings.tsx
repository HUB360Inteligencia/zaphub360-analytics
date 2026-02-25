import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save, UserPlus, Shield, Eye, Settings, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlanUsageCard } from '@/components/PlanUsageCard';

interface OrganizationMember {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
}

const OrganizationSettings = () => {
  const { profile, organization, refreshProfile } = useAuth();
  const { handleAsyncError } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  
  // Form states
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [orgDomain, setOrgDomain] = useState(organization?.domain || '');
  
  // Invite form states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'saas_admin' | 'client' | 'viewer' | 'guest' | 'manager' | 'agent'>('viewer');

  const userRole = profile?.role;
  const canManageOrg = userRole === 'saas_admin';
  const canManageMembers = userRole === 'saas_admin';
  const canChangeRole = userRole === 'saas_admin';

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setOrgDomain(organization.domain || '');
    }
  }, [organization]);

  useEffect(() => {
    loadMembers();
  }, [profile?.organization_id]);

  const loadMembers = async () => {
    if (!profile?.organization_id) return;

    setMembersLoading(true);
    
    const result = await handleAsyncError(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, is_active, last_login_at')
        .eq('organization_id', profile.organization_id)
        .order('full_name');

      if (error) throw error;
      return data;
    }, 'Carregar membros');

    if (result.success) {
      setMembers(result.data || []);
    }
    
    setMembersLoading(false);
  };

  const handleSaveOrganization = async () => {
    if (!organization || !canManageOrg) return;

    setLoading(true);
    
    const result = await handleAsyncError(async () => {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgName.trim(),
          domain: orgDomain.trim() || null,
        })
        .eq('id', organization.id);

      if (error) throw error;
      
      await refreshProfile();
    }, 'Atualização da organização', 'Organização atualizada com sucesso!');

    setLoading(false);
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'saas_admin' | 'client' | 'viewer' | 'guest' | 'manager' | 'agent') => {
    if (!canChangeRole && newRole === 'saas_admin') {
      toast.error('Apenas Administradores podem definir outros administradores');
      return;
    }

    const result = await handleAsyncError(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
    }, 'Alterar permissão', 'Permissão alterada com sucesso!');

    if (result.success) {
      loadMembers();
    }
  };

  const handleToggleMemberStatus = async (memberId: string, isActive: boolean) => {
    if (!canManageMembers) return;

    const result = await handleAsyncError(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', memberId);

      if (error) throw error;
    }, 'Alterar status', `Membro ${isActive ? 'ativado' : 'desativado'} com sucesso!`);

    if (result.success) {
      loadMembers();
    }
  };

  const handleInviteMember = async () => {
    if (!profile?.organization_id || !inviteEmail.trim() || !canManageMembers) return;

    setInviteLoading(true);

    const result = await handleAsyncError(async () => {
      // Obter sessão atual para garantir que temos o token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Você precisa estar autenticado para enviar convites');
      }

      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Erro ao enviar convite:', error);
        throw error as any;
      }
      
      return data;
    }, 'Convite de membro', 'Convite enviado com sucesso!');

    setInviteLoading(false);

    if (result.success) {
      setInviteEmail('');
      setInviteRole('viewer');
      setShowInviteDialog(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'saas_admin': return <Crown className="w-4 h-4" />;
      case 'client': return <Shield className="w-4 h-4" />;
      case 'manager': return <Settings className="w-4 h-4" />;
      case 'agent': return <Settings className="w-4 h-4" />;
      case 'viewer': return <Eye className="w-4 h-4" />;
      case 'guest': return <Eye className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'saas_admin': return 'default';
      case 'client': return 'secondary';
      case 'manager': return 'outline';
      case 'agent': return 'outline';
      case 'viewer': return 'outline';
      case 'guest': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'saas_admin': return 'Administrador';
      case 'client': return 'Cliente';
      case 'manager': return 'Gerente';
      case 'agent': return 'Agente';
      case 'viewer': return 'Visualizador';
      case 'guest': return 'Convidado';
      default: return role;
    }
  };

  if (!organization || !profile) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações da Organização</h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua organização e membros.</p>
      </div>

      <div className="grid gap-6">
        {/* Plan Usage Card */}
        <PlanUsageCard />
        
        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Organização</CardTitle>
            <CardDescription>Configure os dados básicos da sua organização</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Nome da Organização</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Nome da sua empresa"
                  disabled={!canManageOrg}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-domain">Domínio</Label>
                <Input
                  id="org-domain"
                  value={orgDomain}
                  onChange={(e) => setOrgDomain(e.target.value)}
                  placeholder="exemplo.com.br"
                  disabled={!canManageOrg}
                />
              </div>
            </div>

            {canManageOrg && (
              <div className="flex justify-end">
                <Button onClick={handleSaveOrganization} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Members Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Membros da Organização</CardTitle>
                <CardDescription>Gerencie os membros e suas permissões</CardDescription>
              </div>
              {canManageMembers && (
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Convidar Membro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Convidar Novo Membro</DialogTitle>
                      <DialogDescription>
                        Envie um convite para um novo membro se juntar à organização.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-role">Permissão</Label>
                        <Select 
                          value={inviteRole} 
                          onValueChange={(value: 'saas_admin' | 'client' | 'viewer' | 'guest' | 'manager' | 'agent') => setInviteRole(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {canChangeRole && (
                              <SelectItem value="saas_admin">Administrador</SelectItem>
                            )}
                            <SelectItem value="client">Cliente</SelectItem>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="agent">Agente</SelectItem>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                            <SelectItem value="guest">Convidado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleInviteMember} disabled={inviteLoading}>
                        {inviteLoading ? 'Enviando...' : 'Enviar Convite'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="text-center py-4">Carregando membros...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Login</TableHead>
                    {canManageMembers && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.full_name || 'Nome não informado'}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        {canManageMembers && member.id !== profile.id ? (
                          <Select
                            value={member.role}
                            onValueChange={(value: 'saas_admin' | 'client' | 'viewer' | 'guest' | 'manager' | 'agent') => handleUpdateMemberRole(member.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <div className="flex items-center gap-2">
                                {getRoleIcon(member.role)}
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                          <SelectContent>
                            {canChangeRole && (
                              <SelectItem value="saas_admin">
                                <div className="flex items-center gap-2">
                                  <Crown className="w-4 h-4" />
                                  Administrador
                                </div>
                              </SelectItem>
                            )}
                            <SelectItem value="client">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Cliente
                              </div>
                            </SelectItem>
                            <SelectItem value="manager">
                              <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Gerente
                              </div>
                            </SelectItem>
                            <SelectItem value="agent">
                              <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Agente
                              </div>
                            </SelectItem>
                            <SelectItem value="viewer">
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Visualizador
                              </div>
                            </SelectItem>
                            <SelectItem value="guest">
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Convidado
                              </div>
                            </SelectItem>
                          </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(member.role)}
                              {getRoleLabel(member.role)}
                            </div>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {canManageMembers && member.id !== profile.id ? (
                          <Switch
                            checked={member.is_active}
                            onCheckedChange={(checked) => handleToggleMemberStatus(member.id, checked)}
                          />
                        ) : (
                          <Badge variant={member.is_active ? 'default' : 'secondary'}>
                            {member.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.last_login_at 
                          ? format(new Date(member.last_login_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          : 'Nunca'
                        }
                      </TableCell>
                      {canManageMembers && (
                        <TableCell>
                          {member.id === profile.id && (
                            <Badge variant="outline">Você</Badge>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganizationSettings;