
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  usageCount: number;
  createdAt: string;
  lastUsed: string;
  isActive: boolean;
  tags: string[];
}

interface TemplatePreviewProps {
  template: Template | null;
  onClose: () => void;
}

export const TemplatePreview = ({ template, onClose }: TemplatePreviewProps) => {
  if (!template) return null;

  const renderVariables = (variables: string[]) => {
    return variables.map(variable => (
      <Badge key={variable} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
        {`{{${variable}}}`}
      </Badge>
    ));
  };

  const previewContent = (content: string, variables: string[]) => {
    let preview = content;
    variables.forEach(variable => {
      const placeholder = `{{${variable}}}`;
      const sampleData: { [key: string]: string } = {
        nome: 'João Silva',
        evento_nome: 'Reunião Comunitária',
        local: 'Centro Comunitário',
        data: '25/01/2024',
        horario: '19:00',
        assinatura: 'Equipe G360-Wpp',
        semana: 'Semana de 15 a 21 de Janeiro',
        titulo_1: 'Nova praça inaugurada',
        resumo_1: 'A nova praça do bairro foi inaugurada com grande participação.',
        area_atuacao: 'saúde pública',
        descricao_promocao: 'Curso gratuito de capacitação profissional',
        beneficio_principal: 'Certificado reconhecido pelo MEC',
        porcentagem_desconto: '100',
        data_validade: '31/01/2024',
        link: 'https://exemplo.com',
        titulo_reuniao: 'Planejamento 2024'
      };
      preview = preview.replace(new RegExp(placeholder, 'g'), sampleData[variable] || placeholder);
    });
    return preview;
  };

  return (
    <Dialog open={!!template} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="original" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="original">Conteúdo Original</TabsTrigger>
            <TabsTrigger value="preview">Com Dados de Exemplo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="original" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="font-medium">Variáveis Disponíveis</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {renderVariables(template.variables)}
                </div>
              </div>
              <div>
                <Label className="font-medium">Conteúdo do Template</Label>
                <div className="mt-2 p-4 bg-slate-50 rounded border font-mono text-sm whitespace-pre-wrap">
                  {template.content}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <div>
              <Label className="font-medium">Pré-visualização com Dados de Exemplo</Label>
              <div className="mt-2 p-4 bg-white border rounded whitespace-pre-wrap text-sm">
                {previewContent(template.content, template.variables)}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button>Usar Template</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
