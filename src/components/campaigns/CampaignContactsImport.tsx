import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Copy, AlertCircle, CheckCircle, UserPlus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CampaignContactsImportProps {
  campaignName: string;
  onContactsImported: (contacts: ImportedContact[]) => void;
}

export interface ImportedContact {
  id: string;
  name: string;
  phone: string;
  isNew: boolean;
}

interface ContactError {
  line: number;
  contact: string;
  error: string;
}

interface ParsedContact {
  name: string;
  phone: string;
}

export const CampaignContactsImport = ({ campaignName, onContactsImported }: CampaignContactsImportProps) => {
  const { organization } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    created: number;
    updated: number;
    errors: ContactError[];
  } | null>(null);

  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 12 && cleaned.startsWith('55')) {
      return cleaned;
    }
    if (cleaned.length === 11 || cleaned.length === 10) {
      return '55' + cleaned;
    }
    return cleaned;
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  };

  const parseContacts = (text: string): { contacts: ParsedContact[]; errors: ContactError[] } => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const contacts: ParsedContact[] = [];
    const errors: ContactError[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      let name = '';
      let phone = '';

      // Formato: Nome - Telefone ou Nome, Telefone
      if (trimmedLine.includes(' - ')) {
        const parts = trimmedLine.split(' - ');
        name = parts[0].trim();
        phone = parts.slice(1).join(' - ').trim();
      } else if (trimmedLine.includes(',')) {
        const parts = trimmedLine.split(',');
        // Verificar se a primeira parte parece um nome (não é apenas números)
        const firstPart = parts[0].trim();
        if (!/^\d+$/.test(firstPart.replace(/\D/g, '')) || firstPart.replace(/\D/g, '').length < 10) {
          name = firstPart;
          phone = parts.slice(1).join(',').trim();
        } else {
          // Parece ser números separados por vírgula
          parts.forEach((p, pIndex) => {
            const cleanedPhone = p.trim();
            if (validatePhone(cleanedPhone)) {
              contacts.push({
                name: 'Contato Importado',
                phone: formatPhone(cleanedPhone)
              });
            } else if (cleanedPhone) {
              errors.push({
                line: index + 1,
                contact: cleanedPhone,
                error: 'Telefone inválido (deve ter entre 10-13 dígitos)'
              });
            }
          });
          return;
        }
      } else {
        // Apenas telefone
        phone = trimmedLine;
        name = 'Contato Importado';
      }

      if (!validatePhone(phone)) {
        errors.push({
          line: index + 1,
          contact: trimmedLine,
          error: 'Telefone inválido (deve ter entre 10-13 dígitos)'
        });
        return;
      }

      contacts.push({
        name: name || 'Contato Importado',
        phone: formatPhone(phone)
      });
    });

    return { contacts, errors };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Parse CSV - assume first row might be header
      const lines = text.split('\n');
      const parsedLines: string[] = [];

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Detect separator (comma or semicolon)
        const separator = trimmed.includes(';') ? ';' : ',';
        const parts = trimmed.split(separator);

        // Skip header row if detected
        if (index === 0) {
          const firstPart = parts[0].toLowerCase();
          if (firstPart.includes('nome') || firstPart.includes('name') || 
              firstPart.includes('telefone') || firstPart.includes('phone') ||
              firstPart.includes('celular')) {
            return;
          }
        }

        // Try to extract name and phone
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const phone = parts[1].trim();
          if (name && phone) {
            parsedLines.push(`${name} - ${phone}`);
          }
        } else if (parts.length === 1) {
          parsedLines.push(parts[0].trim());
        }
      });

      setTextInput(prev => prev ? prev + '\n' + parsedLines.join('\n') : parsedLines.join('\n'));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!textInput.trim() || !organization?.id) return;

    setIsProcessing(true);
    const { contacts, errors } = parseContacts(textInput);
    
    let createdCount = 0;
    let updatedCount = 0;
    const importErrors: ContactError[] = [...errors];
    const importedContacts: ImportedContact[] = [];

    for (const contact of contacts) {
      try {
        // Check if contact exists
        const { data: existing, error: fetchError } = await supabase
          .from('new_contact_event')
          .select('id_contact_event, name, evento')
          .eq('celular', contact.phone)
          .eq('organization_id', organization.id)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (existing) {
          // Update: add campaign to evento field
          const eventos = existing.evento ? existing.evento.split(' . ') : [];
          const campaignLabel = campaignName || 'Campanha';
          
          if (!eventos.includes(campaignLabel)) {
            eventos.push(campaignLabel);
            await supabase
              .from('new_contact_event')
              .update({ 
                evento: eventos.join(' . '),
                updated_at: new Date().toISOString()
              })
              .eq('id_contact_event', existing.id_contact_event);
          }
          
          updatedCount++;
          importedContacts.push({
            id: existing.id_contact_event.toString(),
            name: existing.name || contact.name,
            phone: contact.phone,
            isNew: false
          });
        } else {
          // Create new contact
          const { data: newContact, error: insertError } = await supabase
            .from('new_contact_event')
            .insert({
              celular: contact.phone,
              name: contact.name,
              evento: campaignName || 'Campanha',
              organization_id: organization.id,
              responsavel_cadastro: 'Importação Campanha',
              status_envio: 'pendente'
            })
            .select('id_contact_event, name')
            .single();

          if (insertError) {
            throw insertError;
          }

          createdCount++;
          importedContacts.push({
            id: newContact.id_contact_event.toString(),
            name: newContact.name || contact.name,
            phone: contact.phone,
            isNew: true
          });
        }
      } catch (error: any) {
        importErrors.push({
          line: 0,
          contact: `${contact.name} - ${contact.phone}`,
          error: error.message || 'Erro ao processar contato'
        });
      }
    }

    setResults({
      created: createdCount,
      updated: updatedCount,
      errors: importErrors
    });

    // Send imported contacts to parent
    if (importedContacts.length > 0) {
      onContactsImported(importedContacts);
    }

    setIsProcessing(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTextInput('');
    setResults(null);
  };

  const copyExample = () => {
    const example = `João Silva - (41) 99999-1111
Maria Santos, 41987654321
Pedro Oliveira - +55 41 98765-4321
41999887766
41888776655, 41777665544`;
    
    navigator.clipboard.writeText(example);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Importar Contatos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Contatos para Campanha</DialogTitle>
          <DialogDescription>
            Adicione contatos rapidamente. Se já existirem, serão atualizados com a campanha.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Importar</TabsTrigger>
            <TabsTrigger value="help">Como usar</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Cole os contatos (um por linha):
                </label>
                <Textarea
                  placeholder="João Silva - (41) 99999-1111&#10;41987654321&#10;Maria, 41888776655"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">ou</span>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <FileText className="w-4 h-4 mr-2" />
                      Carregar CSV
                    </span>
                  </Button>
                </label>
              </div>

              {results && (
                <Alert className={results.errors.length > 0 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      {results.created > 0 && (
                        <div className="flex items-center gap-2 text-green-700">
                          <UserPlus className="w-4 h-4" />
                          <span>{results.created} novos contatos criados</span>
                        </div>
                      )}
                      {results.updated > 0 && (
                        <div className="flex items-center gap-2 text-blue-700">
                          <RefreshCw className="w-4 h-4" />
                          <span>{results.updated} contatos existentes atualizados</span>
                        </div>
                      )}
                      {results.errors.length > 0 && (
                        <div>
                          <p className="font-medium text-orange-700 mb-1">
                            {results.errors.length} erros encontrados:
                          </p>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {results.errors.map((error, index) => (
                              <div key={index} className="text-sm text-orange-600">
                                {error.line > 0 && `Linha ${error.line}: `}{error.contact} - {error.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleImport} 
                  disabled={!textInput.trim() || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Importando...' : 'Importar Contatos'}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  {results ? 'Fechar' : 'Cancelar'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formatos Aceitos</CardTitle>
                <CardDescription>
                  Você pode importar contatos de várias formas:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-medium">Formatos suportados:</p>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1">
                    <div>• Nome - Telefone</div>
                    <div>• Nome, Telefone</div>
                    <div>• Apenas telefone</div>
                    <div>• Vários telefones separados por vírgula</div>
                    <div>• Arquivo CSV (nome;telefone ou nome,telefone)</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Exemplo:</p>
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
{`João Silva - (41) 99999-1111
Maria Santos, 41987654321
Pedro Oliveira - +55 41 98765-4321
41999887766
41888776655, 41777665544`}
                    </pre>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyExample}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Exemplo
                  </Button>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Como funciona:</p>
                      <ul className="text-sm space-y-1 ml-4 list-disc">
                        <li>Se o telefone já existe → atualiza campo "evento" adicionando esta campanha</li>
                        <li>Se não existe → cria novo contato com a campanha</li>
                        <li>DDI 55 é adicionado automaticamente</li>
                        <li>Contatos importados são adicionados à seleção</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignContactsImport;
