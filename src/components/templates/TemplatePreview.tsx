
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Image, Video, Mic, FileText, Phone, MessageSquare } from 'lucide-react';
import { getFormatById } from '@/lib/messageFormats';
import { Template } from '@/hooks/useTemplates';

interface TemplatePreviewProps {
  template: Template | null;
  onClose: () => void;
  onUse?: (template: Template) => void;
}

export const TemplatePreview = ({ template, onClose, onUse }: TemplatePreviewProps) => {
  if (!template) return null;

  const format = getFormatById(template.formato_id || '0001');

  const renderVariables = (variables: string[]) => {
    return variables?.map(variable => (
      <Badge key={variable} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
        {`{{${variable}}}`}
      </Badge>
    ));
  };

  const renderMediaPreview = () => {
    if (!template.media_url || !template.media_type) return null;

    const isImage = template.media_type.startsWith('image/');
    const isVideo = template.media_type.startsWith('video/');
    const isAudio = template.media_type.startsWith('audio/');

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {isImage && <Image className="w-4 h-4" />}
            {isVideo && <Video className="w-4 h-4" />}
            {isAudio && <Mic className="w-4 h-4" />}
            <span className="text-sm font-medium">Mídia Anexada</span>
          </div>
          
          {isImage && (
            <img 
              src={template.media_url} 
              alt="Preview" 
              className="max-w-full max-h-48 rounded border object-cover"
            />
          )}
          
          {isVideo && (
            <video 
              src={template.media_url} 
              controls 
              className="max-w-full max-h-48 rounded border"
            />
          )}
          
          {isAudio && (
            <audio 
              src={template.media_url} 
              controls 
              className="w-full"
            />
          )}
          
          {template.caption && (
            <p className="text-sm text-muted-foreground mt-2">{template.caption}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderLocationPreview = () => {
    if (!template.latitude || !template.longitude) return null;

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Localização</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Lat: {template.latitude}, Long: {template.longitude}
          </p>
        </CardContent>
      </Card>
    );
  };

  const renderButtonsPreview = () => {
    if (!template.botoes || !Array.isArray(template.botoes)) return null;

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Botões Interativos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {template.botoes.map((botao: any, index: number) => (
              <Badge key={index} variant="outline">
                {botao.texto || botao}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContactPreview = () => {
    if (!template.contato_nome || !template.contato_numero) return null;

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4" />
            <span className="text-sm font-medium">Contato Compartilhado</span>
          </div>
          <p className="text-sm">
            <strong>{template.contato_nome}</strong>
          </p>
          <p className="text-sm text-muted-foreground">{template.contato_numero}</p>
        </CardContent>
      </Card>
    );
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {format?.icon && <format.icon className="w-5 h-5" />}
            {template.name}
          </DialogTitle>
          {format && (
            <Badge variant="outline" className="w-fit">
              {format.name}
            </Badge>
          )}
        </DialogHeader>
        
        <Tabs defaultValue="original" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="original">Conteúdo Original</TabsTrigger>
            <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
          </TabsList>
          
          <TabsContent value="original" className="space-y-4">
            <div className="space-y-4">
              {template.variables && template.variables.length > 0 && (
                <div>
                  <Label className="font-medium">Variáveis Disponíveis</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {renderVariables(template.variables)}
                  </div>
                </div>
              )}
              
              <div>
                <Label className="font-medium">Conteúdo do Template</Label>
                <div className="mt-2 p-4 bg-slate-50 rounded border font-mono text-sm whitespace-pre-wrap">
                  {template.content}
                </div>
              </div>

              {renderMediaPreview()}
              {renderLocationPreview()}
              {renderButtonsPreview()}
              {renderContactPreview()}

              {template.mensagem_extra && (
                <div>
                  <Label className="font-medium">Mensagem Extra</Label>
                  <div className="mt-2 p-3 bg-amber-50 rounded border text-sm">
                    {template.mensagem_extra}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-4">
              <Label className="font-medium">Como aparecerá no WhatsApp</Label>
              
              {/* Simulação visual do WhatsApp */}
              <div className="bg-white border rounded-lg p-4 max-w-sm mx-auto shadow-sm">
                <div className="bg-green-500 text-white p-3 rounded-lg rounded-br-none">
                  {renderMediaPreview()}
                  {renderLocationPreview()}
                  
                  <div className="whitespace-pre-wrap text-sm">
                    {previewContent(template.content, template.variables || [])}
                  </div>
                  
                  {renderButtonsPreview()}
                  {renderContactPreview()}
                  
                  {template.mensagem_extra && (
                    <div className="mt-2 text-xs opacity-75">
                      {template.mensagem_extra}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {onUse && (
            <Button onClick={() => onUse(template)}>
              Usar Template
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
