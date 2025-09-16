import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface CampaignContactsTableProps {
  campaignMessages: any[];
  campaign: any;
  navigate: (path: string) => void;
}

const CampaignContactsTable = ({ campaignMessages, campaign, navigate }: CampaignContactsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Calculate pagination
  const totalItems = campaignMessages?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMessages = campaignMessages?.slice(startIndex, endIndex) || [];


  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Lista de Contatos</CardTitle>
          <CardDescription>
            {totalItems} contatos da campanha - Página {currentPage} de {totalPages}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'draft' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
            >
              <Users className="w-4 h-4 mr-2" />
              Gerenciar Audiência
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="500">500</SelectItem>
                <SelectItem value="1000">1000</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">por página</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>

        {currentMessages.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Lido em</TableHead>
                  <TableHead>Respondido em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>{message.nome_contato}</TableCell>
                    <TableCell>{message.celular}</TableCell>
                    <TableCell>
                      <Badge variant={
                        message.status === 'enviado' ? 'default' :
                        message.status === 'erro' ? 'destructive' :
                        'outline'
                      }>
                        {message.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {message.data_envio ? format(new Date(message.data_envio), 'dd/MM HH:mm', { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell>
                      {message.data_leitura ? format(new Date(message.data_leitura), 'dd/MM HH:mm', { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell>
                      {message.data_resposta ? format(new Date(message.data_resposta), 'dd/MM HH:mm', { locale: ptBR }) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma mensagem encontrada para esta campanha.</p>
            {campaign.status === 'draft' && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
              >
                <Users className="w-4 h-4 mr-2" />
                Adicionar Contatos
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignContactsTable;