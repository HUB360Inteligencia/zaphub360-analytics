import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Checkin {
  id: string;
  nome: string;
  celular: string;
  bairro?: string;
  cidade?: string;
  cargo?: string;
  data_aniversario_text?: string;
  created_at: string;
  contacts?: {
    name: string;
    phone: string;
    email?: string;
  };
}

interface CheckinsTableProps {
  checkins: Checkin[];
  isLoading: boolean;
}

export function CheckinsTable({ checkins, isLoading }: CheckinsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCheckins = checkins.filter((checkin) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      checkin.nome.toLowerCase().includes(searchLower) ||
      checkin.celular.includes(searchTerm) ||
      checkin.cidade?.toLowerCase().includes(searchLower) ||
      checkin.cargo?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Carregando check-ins...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por nome, telefone, cidade ou cargo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {filteredCheckins.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">
            {searchTerm ? 'Nenhum check-in encontrado' : 'Nenhum check-in realizado ainda'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCheckins.map((checkin) => (
                <TableRow key={checkin.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{checkin.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">{checkin.celular}</p>
                      {checkin.contacts?.email && (
                        <p className="text-xs text-muted-foreground">
                          {checkin.contacts.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {checkin.cidade || checkin.bairro ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {[checkin.cidade, checkin.bairro].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {checkin.cargo ? (
                      <Badge variant="secondary">{checkin.cargo}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(checkin.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">-</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Total: {filteredCheckins.length} check-in{filteredCheckins.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
