import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Copy, AlertCircle, CheckCircle } from 'lucide-react';
import { useEventContacts } from '@/hooks/useEventContacts';

interface EventContactsImportProps {
  eventId: string;
  eventName: string;
}

interface ContactError {
  line: number;
  contact: string;
  error: string;
}

const EventContactsImport = ({ eventId, eventName }: EventContactsImportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    errors: ContactError[];
  } | null>(null);

  const { createEventContact } = useEventContacts(eventId);

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('55')) {
      return cleaned;
    }
    if (cleaned.length === 11) {
      return '55' + cleaned;
    }
    if (cleaned.length === 10) {
      return '5541' + cleaned;
    }
    return cleaned;
  };

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  };

  const parseContacts = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const contacts: Array<{ name: string; celular: string }> = [];
    const errors: ContactError[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Tentar diferentes formatos de linha
      let name = '';
      let phone = '';

      // Formato: "Nome - Telefone" ou "Nome, Telefone"
      if (trimmedLine.includes(' - ')) {
        const parts = trimmedLine.split(' - ');
        name = parts[0]?.trim() || '';
        phone = parts[1]?.trim() || '';
      } else if (trimmedLine.includes(', ')) {
        const parts = trimmedLine.split(', ');
        name = parts[0]?.trim() || '';
        phone = parts[1]?.trim() || '';
      } else if (trimmedLine.includes(',')) {
        const parts = trimmedLine.split(',');
        name = parts[0]?.trim() || '';
        phone = parts[1]?.trim() || '';
      } else {
        // Apenas telefone
        const phoneMatch = trimmedLine.match(/[\d\(\)\s\-\+]+/);
        if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 10) {
          phone = phoneMatch[0];
          name = trimmedLine.replace(phoneMatch[0], '').trim() || 'Contato sem nome';
        } else {
          errors.push({
            line: index + 1,
            contact: trimmedLine,
            error: 'Formato não reconhecido. Use: Nome - Telefone ou Nome, Telefone'
          });
          return;
        }
      }

      // Validações
      if (!name) {
        name = 'Contato sem nome';
      }

      if (!phone) {
        errors.push({
          line: index + 1,
          contact: trimmedLine,
          error: 'Telefone não encontrado'
        });
        return;
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
        name: name.slice(0, 100), // Limitar tamanho do nome
        celular: formatPhone(phone)
      });
    });

    return { contacts, errors };
  };

  const handleImport = async () => {
    if (!textInput.trim()) return;

    setIsProcessing(true);
    const { contacts, errors } = parseContacts(textInput);
    
    let successCount = 0;
    const importErrors: ContactError[] = [...errors];

    // Importar contatos válidos
    for (const contact of contacts) {
      try {
        await createEventContact.mutateAsync({
          name: contact.name,
          celular: contact.celular,
          evento: eventName,
          event_id: eventId,
          responsavel_cadastro: 'importacao'
        });
        successCount++;
      } catch (error) {
        importErrors.push({
          line: 0,
          contact: `${contact.name} - ${contact.celular}`,
          error: 'Erro ao salvar no banco de dados'
        });
      }
    }

    setResults({
      success: successCount,
      errors: importErrors
    });

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
Ana Costa, (41) 91234-5678
41999887766
Carlos Mendes - 41 9 8877-6655`;
    
    navigator.clipboard.writeText(example);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Contatos em Massa</DialogTitle>
          <DialogDescription>
            Adicione múltiplos contatos de uma vez para o evento "{eventName}"
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
                  placeholder="João Silva - (41) 99999-1111&#10;Maria Santos, 41987654321&#10;Pedro Oliveira - +55 41 98765-4321"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {results && (
                <Alert className={results.errors.length > 0 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      {results.success > 0 && (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          <span>{results.success} contatos importados com sucesso</span>
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
                  Você pode usar qualquer um destes formatos, um contato por linha:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-medium">Formatos suportados:</p>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1">
                    <div>• Nome - Telefone</div>
                    <div>• Nome, Telefone</div>
                    <div>• Apenas o telefone (nome será "Contato sem nome")</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Exemplo:</p>
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-sm">
{`João Silva - (41) 99999-1111
Maria Santos, 41987654321
Pedro Oliveira - +55 41 98765-4321
Ana Costa, (41) 91234-5678
41999887766
Carlos Mendes - 41 9 8877-6655`}
                    </pre>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyExample}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Exemplo
                  </Button>
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Dicas importantes:</p>
                      <ul className="text-sm space-y-1 ml-4 list-disc">
                        <li>Telefones devem ter entre 10-13 dígitos</li>
                        <li>O sistema adiciona automaticamente o DDI 55 quando necessário</li>
                        <li>Formatos com parênteses, hífens e espaços são aceitos</li>
                        <li>Contatos duplicados serão ignorados</li>
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

export default EventContactsImport;