import React, { useState } from 'react';
import { MoreHorizontal, Wifi, WifiOff, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InstanceForm } from './InstanceForm';
import { InstanceStatusBadge } from './InstanceStatusBadge';
import type { Instance } from '@/hooks/useInstances';

interface InstanceCardProps {
  instance: Instance;
}

export function InstanceCard({ instance }: InstanceCardProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('instances')
        .delete()
        .eq('id', instance.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      queryClient.invalidateQueries({ queryKey: ['active-instances'] });
      toast({
        title: 'Instância removida!',
        description: 'A instância foi removida com sucesso.',
      });
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      console.error('Erro ao remover instância:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Ocorreu um erro ao remover a instância. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const newStatus = instance.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('instances')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', instance.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      queryClient.invalidateQueries({ queryKey: ['active-instances'] });
      toast({
        title: 'Status atualizado!',
        description: `Instância ${instance.status === 'active' ? 'desativada' : 'ativada'} com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: 'Ocorreu um erro ao alterar o status. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const getStatusIcon = () => {
    switch (instance.status) {
      case 'active':
        return <Wifi className="h-4 w-4" />;
      case 'inactive':
        return <WifiOff className="h-4 w-4" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">
            {instance.name}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditForm(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleStatusMutation.mutate()}
                disabled={toggleStatusMutation.isPending}
              >
                {getStatusIcon()}
                <span className="ml-2">
                  {instance.status === 'active' ? 'Desativar' : 'Ativar'}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <InstanceStatusBadge status={instance.status} />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Número</span>
              <span className="text-sm font-mono">{instance.phone_number}</span>
            </div>

            {instance.api_url && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API</span>
                <Badge variant="outline" className="text-xs">
                  Configurada
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-muted-foreground">Criada em</span>
              <span className="text-xs text-muted-foreground">
                {new Date(instance.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <InstanceForm 
        open={showEditForm}
        onOpenChange={setShowEditForm}
        instance={instance}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Instância</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a instância "{instance.name}"? 
              Esta ação não pode ser desfeita e todas as campanhas vinculadas a esta instância serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}