
import { useState, useEffect } from 'react';
import { useInstances } from '@/hooks/useInstances';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, AlertTriangle, CheckCircle } from 'lucide-react';

interface Instance {
  id: string;
  name: string;
  phone_number: string;
  status: 'active' | 'inactive' | 'blocked';
}

interface InstanceSelectorProps {
  selectedInstances: string[];
  onInstancesChange: (instanceIds: string[]) => void;
  currentEventInstanceIds?: string[]; // Instance IDs from the current event
}

export const InstanceSelector = ({ selectedInstances, onInstancesChange, currentEventInstanceIds = [] }: InstanceSelectorProps) => {
  const { instances, activeInstances, isLoading } = useInstances();

  // Handle instance status changes and auto-select based on event instance_ids
  useEffect(() => {
    const activeInstanceIds = new Set(activeInstances.map(i => i.id));
    let newSelection = [...selectedInstances];
    
    // Remove inactive instances from selection
    newSelection = newSelection.filter(id => activeInstanceIds.has(id));
    
    // Only auto-select instances on initial load if no instances are selected
    if (selectedInstances.length === 0 && currentEventInstanceIds.length > 0) {
      currentEventInstanceIds.forEach(instanceId => {
        if (activeInstanceIds.has(instanceId) && !newSelection.includes(instanceId)) {
          newSelection.push(instanceId);
        }
      });
    }
    
    // Update selection if changed
    if (newSelection.length !== selectedInstances.length || 
        !newSelection.every(id => selectedInstances.includes(id))) {
      onInstancesChange(newSelection);
    }
  }, [activeInstances, currentEventInstanceIds, onInstancesChange]);

  // Subscribe to real-time instance updates
  useEffect(() => {
    const channel = supabase
      .channel('instances_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'instances',
          filter: `organization_id=eq.${instances[0]?.organization_id}`
        },
        (payload) => {
          // The useInstances hook will automatically refetch when this change occurs
          // and the useEffect above will handle removing inactive instances from selection
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instances]);

  const handleSelectInstance = (instanceId: string) => {
    const instance = instances.find(i => i.id === instanceId);
    // Only allow selection if instance is active
    if (instance?.status !== 'active') return;
    
    const isSelected = selectedInstances.includes(instanceId);
    if (isSelected) {
      onInstancesChange(selectedInstances.filter(id => id !== instanceId));
    } else {
      onInstancesChange([...selectedInstances, instanceId]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive': return <Smartphone className="w-4 h-4 text-gray-600" />;
      case 'blocked': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Smartphone className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'inactive': return 'Inativa';
      case 'blocked': return 'Bloqueada';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando instâncias...</div>
        </CardContent>
      </Card>
    );
  }

  if (instances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Selecionar Instâncias
          </CardTitle>
          <CardDescription>
            Escolha as instâncias que serão usadas para enviar as mensagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma instância encontrada. Você precisa criar pelo menos uma instância primeiro.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Selecionar Instâncias
        </CardTitle>
        <CardDescription>
          Escolha as instâncias que serão usadas para enviar as mensagens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{activeInstances.length}</div>
            <div className="text-sm text-green-700">Ativas</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {instances.filter(i => i.status === 'inactive').length}
            </div>
            <div className="text-sm text-gray-700">Inativas</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {instances.filter(i => i.status === 'blocked').length}
            </div>
            <div className="text-sm text-red-700">Bloqueadas</div>
          </div>
        </div>

        {/* Lista de todas as instâncias */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Instâncias Disponíveis</h4>
          <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
            {instances.map((instance) => {
              const isSelected = selectedInstances.includes(instance.id);
              const isActive = instance.status === 'active';
              return (
                <div
                  key={instance.id}
                  className={`flex items-center space-x-3 p-3 ${isActive ? 'hover:bg-gray-50' : 'bg-gray-50/50'}`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      if (!isActive) return;
                      if (checked) {
                        onInstancesChange([...selectedInstances, instance.id]);
                      } else {
                        onInstancesChange(selectedInstances.filter(id => id !== instance.id));
                      }
                    }}
                    disabled={!isActive}
                    className={!isActive ? 'opacity-50' : ''}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {instance.name}
                    </div>
                    <div className="text-sm text-gray-500">{instance.phone_number}</div>
                  </div>
                  <Badge className={`${getStatusColor(instance.status)} border`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(instance.status)}
                      {getStatusLabel(instance.status)}
                    </div>
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumo da seleção */}
        {selectedInstances.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>{selectedInstances.length} instâncias selecionadas</strong>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              O N8n distribuirá automaticamente as mensagens entre essas instâncias
            </div>
          </div>
        )}

        {/* Alerta para seleção */}
        {selectedInstances.length === 0 && activeInstances.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Selecione pelo menos uma instância ativa para poder criar a campanha.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Alerta quando não há instâncias ativas */}
        {activeInstances.length === 0 && instances.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Todas as instâncias estão inativas. Você precisa ter pelo menos uma instância ativa para criar campanhas.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
