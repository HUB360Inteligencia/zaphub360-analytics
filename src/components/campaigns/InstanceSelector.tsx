
import { useState } from 'react';
import { useInstances } from '@/hooks/useInstances';
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
}

export const InstanceSelector = ({ selectedInstances, onInstancesChange }: InstanceSelectorProps) => {
  const { instances, activeInstances, isLoading } = useInstances();

  const handleSelectInstance = (instanceId: string) => {
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

  if (activeInstances.length === 0) {
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
              Nenhuma instância ativa encontrada. Você precisa ter pelo menos uma instância ativa para criar campanhas.
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

        {/* Lista de instâncias ativas */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Instâncias Disponíveis</h4>
          <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
            {activeInstances.map((instance) => {
              const isSelected = selectedInstances.includes(instance.id);
              return (
                <div
                  key={instance.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectInstance(instance.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectInstance(instance.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{instance.name}</div>
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
        {selectedInstances.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Selecione pelo menos uma instância para poder criar a campanha.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
