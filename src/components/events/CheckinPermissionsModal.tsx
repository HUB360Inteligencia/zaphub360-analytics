import { useState } from 'react';
import { UserCheck, UserX, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEventCheckinPermissions } from '@/hooks/useEventCheckinPermissions';

interface CheckinPermissionsModalProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckinPermissionsModal({
  eventId,
  open,
  onOpenChange,
}: CheckinPermissionsModalProps) {
  const {
    users,
    isLoadingUsers,
    permissions,
    isLoadingPermissions,
    grantPermission,
    revokePermission,
  } = useEventCheckinPermissions(eventId);

  const getUserPermission = (userId: string) => {
    return permissions.find((p) => p.user_id === userId);
  };

  const handleTogglePermission = async (userId: string) => {
    const permission = getUserPermission(userId);
    if (permission) {
      await revokePermission.mutateAsync(permission.id);
    } else {
      await grantPermission.mutateAsync(userId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Permissões de Check-in
          </DialogTitle>
          <DialogDescription>
            Selecione quais usuários podem realizar check-ins neste evento
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoadingUsers || isLoadingPermissions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const hasPermission = !!getUserPermission(user.id);
                const isAdmin = user.role && ['saas_admin', 'client', 'manager'].includes(user.role);

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.full_name || user.email}</p>
                        {isAdmin && (
                          <Badge variant="secondary" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>

                    {isAdmin ? (
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Acesso Total
                      </Badge>
                    ) : (
                      <Button
                        variant={hasPermission ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleTogglePermission(user.id)}
                        disabled={
                          grantPermission.isPending || revokePermission.isPending
                        }
                      >
                        {hasPermission ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" />
                            Remover
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Conceder
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
