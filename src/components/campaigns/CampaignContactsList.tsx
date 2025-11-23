import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSearchParams } from 'react-router-dom';
import { useCampaignContacts } from '@/hooks/useCampaignContacts';
import { useCampaignAnalytics } from '@/hooks/useCampaignAnalytics';
import StatusSelect from '@/components/events/StatusSelect';
import SentimentSelect from '@/components/events/SentimentSelect';
import ContactProfileModal from '@/components/contacts/ContactProfileModal';
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown, Filter, Search, Eye, Trash2 } from 'lucide-react';

const STATUS_OPTIONS = ['fila', 'pendente', 'processando', 'enviado', 'erro'];

type SortBy = 'nome_contato' | 'status' | 'sentimento' | 'perfil_contato';
type SortDirection = 'asc' | 'desc';

interface CampaignContactsListProps {
  campaignId: string;
}

const CampaignContactsList = ({ campaignId }: CampaignContactsListProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [profileModalContact, setProfileModalContact] = useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
  const search = searchParams.get('search') || '';
  const sortBy = (searchParams.get('sortBy') as SortBy) || 'nome_contato';
  const sortDirection = (searchParams.get('sortDirection') as SortDirection) || 'asc';
  const selectedStatuses = (searchParams.get('statuses') || '')
    .split(',')
    .filter(Boolean);

  // Local state for debounced search input
  const [localSearch, setLocalSearch] = useState<string>(search);
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (localSearch.trim()) next.set('search', localSearch.trim()); else next.delete('search');
      next.set('page', '1');
      setSearchParams(next, { replace: true });
    }, 400);
    return () => clearTimeout(timeout);
  }, [localSearch]);

  const { rows, total, isLoading, error, updateStatus, updateSentiment, deleteContact } = useCampaignContacts({
    campaignId,
    page,
    pageSize,
    search,
    statuses: selectedStatuses,
    sortBy,
    sortDirection,
  });

  // Hook para estatísticas de sentimento
  const { analytics } = useCampaignAnalytics(campaignId);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  const setParam = (key: string, value: string | number | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === '' || value === null) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    setSearchParams(next, { replace: true });
  };

  const toggleStatus = (status: string) => {
    const next = new URLSearchParams(searchParams);
    const current = (next.get('statuses') || '').split(',').filter(Boolean);
    const exists = current.includes(status);
    const updated = exists ? current.filter(s => s !== status) : [...current, status];
    if (updated.length === 0) next.delete('statuses'); else next.set('statuses', updated.join(','));
    next.set('page', '1');
    setSearchParams(next, { replace: true });
  };

  const handleSort = (column: SortBy) => {
    const next = new URLSearchParams(searchParams);
    const currentSortBy = (next.get('sortBy') as SortBy) || 'nome_contato';
    const currentDir = (next.get('sortDirection') as SortDirection) || 'asc';
    if (currentSortBy === column) {
      next.set('sortDirection', currentDir === 'asc' ? 'desc' : 'asc');
    } else {
      next.set('sortBy', column);
      next.set('sortDirection', 'asc');
    }
    next.set('page', '1');
    setSearchParams(next, { replace: true });
  };

  const renderSortIcon = (column: SortBy) => {
    if (sortBy !== column) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const onPageSizeChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('pageSize', value);
    next.set('page', '1');
    setSearchParams(next, { replace: true });
  };

  const onPageChange = (newPage: number) => {
    setParam('page', Math.max(1, Math.min(totalPages, newPage)));
  };

  const statusChips = useMemo(() => STATUS_OPTIONS.map(s => ({
    value: s,
    selected: selectedStatuses.includes(s)
  })), [selectedStatuses]);

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Cards de Estatísticas de Sentimento */}
      {analytics?.sentimentAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <div>
                  <p className="text-xs text-muted-foreground">Super Engajado</p>
                  <p className="text-lg font-bold text-orange-600">{analytics.sentimentAnalysis.superEngajado}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">😊</span>
                <div>
                  <p className="text-xs text-muted-foreground">Positivo</p>
                  <p className="text-lg font-bold text-green-600">{analytics.sentimentAnalysis.positivo}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">😐</span>
                <div>
                  <p className="text-xs text-muted-foreground">Neutro</p>
                  <p className="text-lg font-bold text-gray-600">{analytics.sentimentAnalysis.neutro}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚪</span>
                <div>
                  <p className="text-xs text-muted-foreground">Sem classificação</p>
                  <p className="text-lg font-bold text-gray-600">{analytics.sentimentAnalysis.semClassificacao}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">😞</span>
                <div>
                  <p className="text-xs text-muted-foreground">Negativo</p>
                  <p className="text-lg font-bold text-red-600">{analytics.sentimentAnalysis.negativo}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Contatos da Campanha</CardTitle>
              <CardDescription>
                {total.toLocaleString()} contatos encontrados — Página {page} de {totalPages}
              </CardDescription>
            </div>
          </div>

          {/* Toolbar com grid responsivo */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome (parcial) ou telefone (exato)"
                className="pl-10 w-full"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Botão de filtros avançados */}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
            
            {/* Chips de status */}
            <div className="flex items-center gap-1 flex-wrap col-span-2">
              {statusChips.map(chip => (
                <Button
                  key={chip.value}
                  type="button"
                  variant={chip.selected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleStatus(chip.value)}
                >
                  {chip.value}
                </Button>
              ))}
            </div>

            {/* Page size */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mostrar:</span>
              <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
                <SelectTrigger className="w-24">
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
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-destructive">Erro ao carregar contatos.</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum contato encontrado</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="rounded-md border hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('nome_contato')}>
                        <div className="flex items-center gap-2">Nome {renderSortIcon('nome_contato')}</div>
                      </TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                        <div className="flex items-center gap-2">Status {renderSortIcon('status')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('sentimento')}>
                        <div className="flex items-center gap-2">Sentimento {renderSortIcon('sentimento')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('perfil_contato')}>
                        <div className="flex items-center gap-2">Perfil {renderSortIcon('perfil_contato')}</div>
                      </TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.nome_contato || 'Sem nome'}</TableCell>
                        <TableCell>{row.celular || '-'}</TableCell>
                        <TableCell>
                          <StatusSelect
                            value={row.status || 'pendente'}
                            onValueChange={(status) => updateStatus.mutate({ id: row.id, status })}
                            disabled={updateStatus.isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <SentimentSelect
                            value={row.sentimento}
                            onValueChange={(s) => updateSentiment.mutate({ id: row.id, sentimento: s })}
                            disabled={updateSentiment.isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="truncate max-w-[140px]">{row.perfil_contato || 'Sem classificação'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProfileModalContact({
                                id: row.id,
                                name: row.nome_contato || 'Sem nome',
                                phone: row.celular,
                                sentimento: row.sentimento,
                                status: row.status || 'active',
                                organization_id: '',
                                created_at: '',
                                updated_at: '',
                              })}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => setConfirmDeleteId(row.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile stacked list */}
              <div className="block md:hidden space-y-3">
                {rows.map(row => (
                  <Card key={row.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm truncate">{row.nome_contato || 'Sem nome'}</div>
                        <StatusSelect
                          value={row.status || 'pendente'}
                          onValueChange={(status) => updateStatus.mutate({ id: row.id, status })}
                          disabled={updateStatus.isPending}
                        />
                      </div>

                      <div className="text-xs text-muted-foreground break-all">{row.celular || '-'}</div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <SentimentSelect
                            value={row.sentimento}
                            onValueChange={(s) => updateSentiment.mutate({ id: row.id, sentimento: s })}
                            disabled={updateSentiment.isPending}
                          />
                        </div>
                        <Badge variant="outline" className="text-xs">{row.perfil_contato || 'Sem classificação'}</Badge>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setProfileModalContact({
                            id: row.id,
                            name: row.nome_contato || 'Sem nome',
                            phone: row.celular,
                            sentimento: row.sentimento,
                            status: row.status || 'active',
                            organization_id: '',
                            created_at: '',
                            updated_at: '',
                          })}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Perfil
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setConfirmDeleteId(row.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Anterior</Button>
                  <span className="text-sm text-muted-foreground">{startIndex}-{endIndex} de {total.toLocaleString()}</span>
                  <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Próximo</Button>
                </div>
              )}
            </>
          )}
        </CardContent>

        {/* Delete Confirmation */}
        <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir contato</DialogTitle>
              <DialogDescription>Confirma a exclusão deste contato desta campanha? Esta ação não pode ser desfeita.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirmDeleteId) {
                    deleteContact.mutate(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }
                }}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Modal */}
        <ContactProfileModal
          isOpen={!!profileModalContact}
          onClose={() => setProfileModalContact(null)}
          contact={profileModalContact}
          mode="view"
        />
      </Card>
    </div>
  );
};

export default CampaignContactsList;