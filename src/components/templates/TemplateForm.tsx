
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface TemplateFormProps {
  categories: Category[];
}

export const TemplateForm = ({ categories }: TemplateFormProps) => {
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
        assinatura: 'Equipe G360-Wpp'
      };
      preview = preview.replace(new RegExp(placeholder, 'g'), sampleData[variable] || placeholder);
    });
    return preview;
  };

  return (
    <Tabs defaultValue="editor" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="editor">Editor</TabsTrigger>
        <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
      </TabsList>
      
      <TabsContent value="editor" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="template-name">Nome do Template *</Label>
            <Input id="template-name" placeholder="Ex: Convite para Evento" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="template-category">Categoria *</Label>
            <Select>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="template-description">Descrição</Label>
          <Input id="template-description" placeholder="Breve descrição do template..." className="mt-1" />
        </div>

        <div>
          <Label htmlFor="template-content">Conteúdo da Mensagem *</Label>
          <Textarea 
            id="template-content" 
            placeholder="Digite o conteúdo da mensagem...&#10;&#10;Use {{variavel}} para campos dinâmicos.&#10;Exemplo: Olá {{nome}}, você está convidado para {{evento}}." 
            className="mt-1 min-h-[200px] font-mono text-sm"
          />
        </div>

        <div>
          <Label>Variáveis Detectadas</Label>
          <div className="mt-2 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">
              As variáveis serão detectadas automaticamente quando você usar o formato {"{{variavel}}"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">{"{{nome}}"}</Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">{"{{evento}}"}</Badge>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="template-tags">Tags (separadas por vírgula)</Label>
          <Input id="template-tags" placeholder="evento, convite, politica" className="mt-1" />
        </div>
      </TabsContent>

      <TabsContent value="preview" className="space-y-4">
        <div className="border rounded-lg p-4 bg-white">
          <h4 className="font-semibold mb-2">Pré-visualização</h4>
          <div className="bg-slate-50 p-4 rounded border text-sm whitespace-pre-wrap font-mono">
            Olá João Silva, você está convidado para Reunião Comunitária.
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
