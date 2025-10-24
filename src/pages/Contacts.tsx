import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, Filter, Download, Upload, Users, Phone, Mail, Loader2 } from 'lucide-react';
import { useContacts, Contact } from '@/hooks/useContacts';
import { useTags } from '@/hooks/useTags';
import { useAuth } from '@/contexts/AuthContext';
import ContactProfileModal from '@/components/contacts/ContactProfileModal';
import ContactsTable from '@/components/contacts/ContactsTable';
import { getSentimentColor } from '@/lib/brazilianStates';
import AdvancedFiltersModal from '@/components/contacts/AdvancedFiltersModal';

// Tipo local para o Contacts.tsx
type AdvancedFilters = {
  searchTerm: string;
  sentiments: string[];
  cities: string[];
  neighborhoods: string[];
  dateRange: { from: string; to: string };
  tags: string[];
  status: string[];
  searchOperator: 'AND' | 'OR';
};
import { useAdvancedContactFilters } from '@/hooks/useAdvancedContactFilters';
import { useDebounce } from '@/hooks/useDebounce';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Contacts = () => {
  const { organization } = useAuth();
  const { tags, isLoading: tagsLoading } = useTags();
  
  // Estados para controles de interface
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Estados para filtros
  const [filterCidade, setFilterCidade] = useState('all');
  const [filterBairro, setFilterBairro] = useState('all');
  const [filterSentimento, setFilterSentimento] = useState('all');
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  // Estados para ordenação
  const [sortBy, setSortBy] = useState<'name' | 'cidade' | 'bairro' | 'sentimento' | 'evento'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Modal de perfil
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'view' | 'edit'>('view');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // Advanced filters state
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [useAdvancedFilters, setUseAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    searchTerm: '',
    sentiments: [],
    cities: [],
    neighborhoods: [],
    dateRange: { from: '', to: '' },
    tags: [],
    status: [],
    searchOperator: 'AND'
  });

  // Debounce da busca para evitar muitas consultas
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Regular filters
  const regularFilters = useContacts({
    searchTerm: debouncedSearchTerm,
    filterCidade,
    filterBairro,
    filterSentimento,
    selectedTag,
    page: currentPage,
    pageSize: pageSize,
    sortBy,
    sortDirection
  });

  // Advanced filters
  const advancedFiltersResult = useAdvancedContactFilters(
    advancedFilters,
    currentPage,
    pageSize
  );

  // Use appropriate data source based on filter mode
  const {
    contacts,
    contactsCount,
    contactsLoading,
    createContact,
    updateContact,
    deleteContact,
    restoreContact,
    refetch
  } = useAdvancedFilters ? {
    contacts: advancedFiltersResult.contacts,
    contactsCount: advancedFiltersResult.contactsCount,
    contactsLoading: advancedFiltersResult.contactsLoading,
    createContact: regularFilters.createContact,
    updateContact: regularFilters.updateContact,
    deleteContact: regularFilters.deleteContact,
    restoreContact: regularFilters.restoreContact,
    refetch: advancedFiltersResult.refetch
  } : {
    contacts: regularFilters.contacts,
    contactsCount: regularFilters.contactsCount,
    contactsLoading: regularFilters.isLoading,
    createContact: regularFilters.createContact,
    updateContact: regularFilters.updateContact,
    deleteContact: regularFilters.deleteContact,
    restoreContact: regularFilters.restoreContact,
    refetch: regularFilters.refetch
  };

  const filters = useAdvancedFilters ? advancedFiltersResult.filterOptions : regularFilters.filters;
  const filtersLoading = useAdvancedFilters ? advancedFiltersResult.filterOptionsLoading : regularFilters.isFiltersLoading;

  // Estatísticas calculadas com base nos contatos
  const stats = useMemo(() => {
    if (!contacts) return { total: 0, active: 0, withEmail: 0, searchResults: 0 };
    
    return {
      total: contactsCount || 0,
      active: contacts.filter(c => c.status === 'active').length,
      withEmail: contacts.filter(c => c.email).length,
      searchResults: contacts.length
    };
  }, [contacts, contactsCount]);

  // Estatísticas das tags
  const tagStats = useMemo(() => {
    if (!contacts || !tags) return [];
    
    return tags.map(tag => ({
      ...tag,
      count: contacts.filter(contact => 
        contact.tags?.some(contactTag => contactTag.name === tag.name)
      ).length
    }));
  }, [contacts, tags]);

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSortChange = (column: string) => {
    const validColumn = column as 'name' | 'cidade' | 'bairro' | 'sentimento' | 'evento';
    if (sortBy === validColumn) {
      // Toggle through: asc -> desc -> default (name asc)
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        // Reset to default
        setSortBy('name');
        setSortDirection('asc');
      }
    } else {
      // New column, start with asc
      setSortBy(validColumn);
      setSortDirection('asc');
    }
  };

  const handleCreateContact = async (contactData: any) => {
    try {
      await createContact.mutateAsync(contactData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar contato:', error);
    }
  };

  const handleViewProfile = (contact: Contact) => {
    setSelectedContact(contact);
    setProfileModalMode('view');
    setProfileModalOpen(true);
  };

  const handleEditProfile = (contact: Contact) => {
    setSelectedContact(contact);
    setProfileModalMode('edit');
    setProfileModalOpen(true);
  };

  const handleUpdateContact = async (contactData: Partial<Contact>) => {
    if (!selectedContact) return;
    
    try {
      await updateContact.mutateAsync({ 
        id: selectedContact.id, 
        ...contactData 
      });
      setProfileModalOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
    }
  };

  const handleAdvancedFiltersApply = (newFilters: AdvancedFilters) => {
    setAdvancedFilters(newFilters);
    setUseAdvancedFilters(true);
    setCurrentPage(1); // Reset to first page when applying filters
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({
      searchTerm: '',
      sentiments: [],
      cities: [],
      neighborhoods: [],
      dateRange: { from: '', to: '' },
      tags: [],
      status: [],
      searchOperator: 'AND'
    });
    setUseAdvancedFilters(false);
  };

  const handleExportExcel = () => {
    if (!contacts || contacts.length === 0) return;

    const excelData = contacts.map((contact, index) => ({
      'Linha': index + 1,
      'Nome': contact.name || '',
      'Telefone': contact.phone || '',
      'Email': contact.email || '',
      'Cidade': (contact as any).cidade || '',
      'Bairro': (contact as any).bairro || '',
      'Sentimento': (contact as any).sentimento || '',
      'Evento': (contact as any).evento || '',
      'Tags': Array.isArray(contact.tags) ? contact.tags.map((t: any) => t.name).join(', ') : '',
      'Status': contact.status || '',
      'Data de Cadastro': contact.created_at ? new Date(contact.created_at).toLocaleDateString('pt-BR') : '',
      'Observações': contact.notes || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Contatos Filtrados');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `contatos-filtrados-${dateStr}-${timeStr}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Estados e helpers de importação CSV
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState({ total: 0, processed: 0, inserted: 0, skipped: 0, invalid: 0 });

  function normalizePhone(raw: string | null | undefined) {
    if (!raw) return '';
    const digits = raw.replace(/\D+/g, '');
    const cleaned = digits.length > 13 && digits.startsWith('55') ? digits.slice(2) : digits;
    return cleaned;
  }

  function parseCsvFlexible(text: string) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const delimiter = lines[0].includes(';') ? ';' : ',';
    const parseLine = (line: string) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; }
        } else if (ch === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current.trim());
      return result;
    };
    const headerCells = parseLine(lines[0]).map(h => h.toLowerCase().trim());
    const rows = lines.slice(1).map(parseLine);
    return { headers: headerCells, rows };
  }

  function mapHeader(header: string) {
    const h = header.toLowerCase().trim();
    if (['celular', 'telefone', 'phone', 'whatsapp', 'contato', 'numero'].includes(h)) return 'celular';
    if (['nome', 'name'].includes(h)) return 'name';
    if (['sobrenome', 'last_name', 'lastname'].includes(h)) return 'sobrenome';
    if (['cidade', 'city'].includes(h)) return 'cidade';
    if (['bairro', 'neighborhood'].includes(h)) return 'bairro';
    if (['sentimento', 'sentiment'].includes(h)) return 'sentimento';
    if (['evento', 'event'].includes(h)) return 'evento';
    if (['perfil_contato', 'perfil', 'perfil contato', 'profile'].includes(h)) return 'perfil_contato';
    return h;
  }

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0] || null;
    setImportError(null);
    setImportProgress({ total: 0, processed: 0, inserted: 0, skipped: 0, invalid: 0 });
    if (!file) { setImportFile(null); return; }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Selecione um arquivo .csv');
      setImportFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImportError('Arquivo muito grande (máx. 10MB)');
      setImportFile(null);
      return;
    }
    setImportFile(file);
  };
  
  // Helper para normalizar valores do CSV (vazio -> null)
  const normalizeCsvValue = (v: any) => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
  };

  async function handleImportFileClick() {
    if (!importFile) {
      toast.error('Selecione um arquivo CSV antes de importar');
      return;
    }
    if (!organization?.id) {
      toast.error('Organização não encontrada');
      return;
    }

    setImportError(null);
    setImporting(true);
    setImportProgress({ total: 0, processed: 0, inserted: 0, skipped: 0, invalid: 0 });

    try {
      if (!importFile.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Arquivo precisa ser .csv');
      }
      if (importFile.size > 10 * 1024 * 1024) {
        throw new Error('Arquivo muito grande (máx. 10MB)');
      }

      const text = await importFile.text();
      const { headers, rows } = parseCsvFlexible(text);
      if (!headers.length || !rows.length) {
        throw new Error('CSV vazio ou cabeçalho ausente');
      }

      const mappedHeaders = headers.map(mapHeader);
      const idx = (key: string) => mappedHeaders.findIndex(h => h === key);
      const idxPhone = idx('celular');
      const idxName = idx('name');
      const idxSobrenome = idx('sobrenome');
      const idxCidade = idx('cidade');
      const idxBairro = idx('bairro');
      const idxSentimento = idx('sentimento');
      const idxEvento = idx('evento');
      const idxPerfil = idx('perfil_contato');

      if (idxPhone === -1) {
        throw new Error('Coluna de telefone não encontrada (ex.: celular/telefone/phone)');
      }

      const prepared = rows.map((cells, index) => {
        const phone = normalizePhone(cells[idxPhone] || '');
        const name = idxName !== -1 ? cells[idxName] : '';
        const sobrenome = idxSobrenome !== -1 ? cells[idxSobrenome] : '';
        const cidade = idxCidade !== -1 ? cells[idxCidade] : '';
        const bairro = idxBairro !== -1 ? cells[idxBairro] : '';
        const sentimento = idxSentimento !== -1 ? cells[idxSentimento] : null;
        const evento = idxEvento !== -1 ? cells[idxEvento] : 'Import CSV';
        const perfil_contato = idxPerfil !== -1 ? cells[idxPerfil] : null;
        return {
          phone,
          name,
          sobrenome,
          cidade,
          bairro,
          sentimento,
          evento,
          perfil_contato,
          rowIndex: index + 2,
          originalRow: {
            headers,
            cells
          }
        };
      });

      const total = prepared.length;
      setImportProgress(prev => ({ ...prev, total }));

      // Registros inválidos (telefone vazio ou < 10 dígitos)
      const invalidRecords = prepared.filter(r => !r.phone || r.phone.length < 10);
      const invalid = invalidRecords.length;
      const valid = prepared.filter(r => r.phone && r.phone.length >= 10);
      setImportProgress(prev => ({ ...prev, invalid }));

      // Criar registro de auditoria
      const { data: audit, error: auditErr } = await supabase
        .from('contact_import_audits')
        .insert({
          organization_id: organization.id,
          filename: importFile.name,
          total_rows: total
        })
        .select()
        .single();
      if (auditErr) throw auditErr;
      const auditId = audit.id;

      // Logar inválidos
      if (invalidRecords.length > 0) {
        const invalidIgnored = invalidRecords.map(r => ({
          audit_id: auditId,
          celular: r.phone || '',
          reason: 'invalid phone',
          original_row: r.originalRow
        }));
        const chunkSizeLog = 1000;
        for (let i = 0; i < invalidIgnored.length; i += chunkSizeLog) {
          const chunk = invalidIgnored.slice(i, i + chunkSizeLog);
          const { error: logErr } = await supabase
            .from('contact_import_ignored')
            .insert(chunk);
          if (logErr) throw logErr;
        }
      }

      // Consultar existentes na base para este lote
      const uniquePhones = Array.from(new Set(valid.map(r => r.phone)));
      let existingSet = new Set<string>();
      if (uniquePhones.length > 0) {
        const { data: existingRows, error: existingErr } = await supabase
          .from('new_contact_event')
          .select('celular')
          .eq('organization_id', organization.id)
          .in('celular', uniquePhones);
        if (existingErr) throw existingErr;
        existingSet = new Set((existingRows || []).map(r => r.celular));
      }

      // Separar duplicados e novos para inserção
      const duplicateRecords = valid.filter(r => existingSet.has(r.phone));
      const toInsertRecords = valid.filter(r => !existingSet.has(r.phone));

      // Logar duplicados
      if (duplicateRecords.length > 0) {
        const dupIgnored = duplicateRecords.map(r => ({
          audit_id: auditId,
          celular: r.phone,
          reason: 'duplicate',
          original_row: r.originalRow
        }));
        const chunkSizeLog = 1000;
        for (let i = 0; i < dupIgnored.length; i += chunkSizeLog) {
          const chunk = dupIgnored.slice(i, i + chunkSizeLog);
          const { error: logErr } = await supabase
            .from('contact_import_ignored')
            .insert(chunk);
          if (logErr) throw logErr;
        }
      }

      // Atualizar duplicados com dados do CSV apenas quando campos estão vazios
      let updatedCount = 0;
      if (duplicateRecords.length > 0) {
        const batch = duplicateRecords.map(r => ({
          celular: r.phone,
          name: normalizeCsvValue(r.name),
          sobrenome: normalizeCsvValue(r.sobrenome),
          cidade: normalizeCsvValue(r.cidade),
          bairro: normalizeCsvValue(r.bairro),
          perfil_contato: normalizeCsvValue(r.perfil_contato),
          sentimento: normalizeCsvValue(r.sentimento),
          evento: normalizeCsvValue(r.evento),
          tag: null,
        }));
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('update_new_contact_event_if_empty_batch', {
            records: batch,
            p_org_id: organization.id,
          });
        if (rpcError) {
          console.error('Erro ao atualizar duplicados:', rpcError);
          toast.error('Falha ao atualizar contatos duplicados.');
        } else {
          updatedCount = rpcData ?? 0;
        }
      }
      const duplicatesLeft = duplicateRecords.length - (updatedCount || 0);

      // Montar payload apenas dos que serão inseridos
      const payload = toInsertRecords.map(r => ({
        celular: r.phone,
        name: normalizeCsvValue(r.name),
        sobrenome: normalizeCsvValue(r.sobrenome),
        cidade: normalizeCsvValue(r.cidade),
        bairro: normalizeCsvValue(r.bairro),
        sentimento: normalizeCsvValue(r.sentimento),
        evento: normalizeCsvValue(r.evento) ?? 'Import CSV',
        perfil_contato: normalizeCsvValue(r.perfil_contato),
        organization_id: organization.id,
        responsavel_cadastro: 'Importador',
      }));

      const chunkSize = 500;
      let processed = 0;
      let inserted = 0;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('new_contact_event')
          .insert(chunk);
        if (error) throw error;
        processed += chunk.length;
        inserted += chunk.length;
        setImportProgress(prev => ({ ...prev, processed, inserted }));
      }

      // Atualizar auditoria
      await supabase
        .from('contact_import_audits')
        .update({
          valid_rows: valid.length,
          inserted_rows: inserted,
          ignored_rows: invalid + duplicatesLeft,
        })
        .eq('id', auditId);

      toast.success(`Importação concluída: ${processed} inseridos, ${invalid} inválidos, ${updatedCount} duplicados atualizados, ${duplicatesLeft} duplicados ignorados`);
      setIsImportDialogOpen(false);
      setImportFile(null);
      await refetch();
    } catch (err: any) {
      console.error('Erro na importação:', err);
      setImportError(err?.message || 'Erro ao importar CSV');
      toast.error(err?.message || 'Erro ao importar CSV');
    } finally {
      setImporting(false);
    }
  }

  if (tagsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
          <p className="text-slate-600">
            Gerencie seus contatos e acompanhe o engajamento
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Contatos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Faça upload de um arquivo CSV com os dados dos contatos
                </p>
                <Input type="file" accept=".csv" onChange={handleFileChange} />
                {importError && (
                  <p className="text-sm text-red-600">{importError}</p>
                )}
                {importing ? (
                  <Button className="w-full" disabled>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </Button>
                ) : (
                  <Button className="w-full" onClick={handleImportFileClick} disabled={!importFile}>
                    Importar Arquivo
                  </Button>
                )}
                {(importProgress.total > 0) && (
                  <div className="text-sm text-slate-600">
                    <div>Total: {importProgress.total}</div>
                    <div>Processados: {importProgress.processed}</div>
                    <div>Inválidos: {importProgress.invalid}</div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Contato</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" placeholder="Nome do contato" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" />
                </div>
                <Button className="w-full" onClick={() => setIsCreateDialogOpen(false)}>
                  Criar Contato
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Contatos</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Contatos Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</p>
              </div>
              <Phone className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Com Email</p>
                <p className="text-2xl font-bold text-purple-600">{stats.withEmail.toLocaleString()}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Resultados da Busca</p>
                <p className="text-2xl font-bold text-orange-600">{stats.searchResults.toLocaleString()}</p>
              </div>
              <Search className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Filtrar por Tags</h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedTag === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedTag('all')}
              >
                Todas ({stats.total})
              </Badge>
              {tagStats.map(tag => (
                <Badge
                  key={tag.id}
                  variant={selectedTag === tag.name ? 'default' : 'outline'}
                  className="cursor-pointer"
                  style={{ backgroundColor: selectedTag === tag.name ? tag.color : undefined }}
                  onClick={() => setSelectedTag(tag.name)}
                >
                  {tag.name} ({tag.count})
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={useAdvancedFilters ? "default" : "outline"} 
                  className="w-full sm:w-auto"
                  onClick={() => setAdvancedFiltersOpen(true)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros Avançados
                  {useAdvancedFilters && (
                    <Badge variant="secondary" className="ml-2">
                      Ativo
                    </Badge>
                  )}
                </Button>
                {useAdvancedFilters && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearAdvancedFilters}
                  >
                    Limpar Filtros
                  </Button>
                )}
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto"
                    onClick={handleExportExcel}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
              </div>
            </div>
            
            {/* Filtros Simples (apenas quando não está usando filtros avançados) */}
            {!useAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filterCidade} onValueChange={setFilterCidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {filters.cidades?.map(cidade => (
                    <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterBairro} onValueChange={setFilterBairro}>
                <SelectTrigger>
                  <SelectValue placeholder="Bairro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os bairros</SelectItem>
                  {filters.bairros?.map(bairro => (
                    <SelectItem key={bairro} value={bairro}>{bairro}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterSentimento} onValueChange={setFilterSentimento}>
                <SelectTrigger>
                  <SelectValue placeholder="Sentimento" />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os sentimentos</SelectItem>
                    {filters.sentimentos?.map(sentimento => (
                      <SelectItem key={sentimento} value={sentimento}>{sentimento}</SelectItem>
                    ))}
                  </SelectContent>
              </Select>
              
              <Select value="all" onValueChange={() => {}}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <ContactsTable
        contacts={contacts}
        selectedContacts={selectedContacts}
        onSelectContact={handleSelectContact}
        onSelectAll={handleSelectAll}
        onViewProfile={handleViewProfile}
        onEditProfile={handleEditProfile}
        onDeleteContact={(id) => deleteContact.mutate(id)}
        onRestoreContact={(contactData) => restoreContact.mutate(contactData)}
        getSentimentColor={getSentimentColor}
        currentPage={currentPage}
        pageSize={pageSize}
        totalContacts={contactsCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={contactsLoading}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        isOpen={advancedFiltersOpen}
        onClose={() => setAdvancedFiltersOpen(false)}
        filters={advancedFilters}
        onApplyFilters={handleAdvancedFiltersApply}
        contacts={useAdvancedFilters ? advancedFiltersResult.contacts : contacts}
        availableData={{
          sentiments: advancedFiltersResult.filterOptions.sentimentos || [],
          cities: advancedFiltersResult.filterOptions.cidades || [],
          neighborhoods: advancedFiltersResult.filterOptions.bairros || [],
          tags: tagStats.map(tag => tag.name) || [],
          neighborhoodsByCity: advancedFiltersResult.filterOptions.neighborhoodsByCity || {},
        }}
      />

      {/* Contact Profile Modal */}
      {selectedContact && (
        <ContactProfileModal
          contact={selectedContact}
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          mode={profileModalMode}
          onUpdate={handleUpdateContact}
        />
      )}
    </div>
  );
};

export default Contacts;