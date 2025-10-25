import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Mail, MapPin, Calendar, MessageSquare, Edit, Save, X, User, Building2, Check, CheckCheck } from 'lucide-react';
import { Contact } from '@/hooks/useContacts';
import { useContactProfile } from '@/hooks/useContactProfile';

interface ContactProfileModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (contact: Contact) => void;
  mode: 'view' | 'edit';
}

const getSentimentColor = (sentiment?: string) => {
  switch (sentiment) {
    case 'Super Engajado':
      return 'bg-orange-500 text-white';
    case 'Positivo':
      return 'bg-green-500 text-white';
    case 'Neutro':
      return 'bg-gray-500 text-white';
    case 'Negativo':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-200 text-gray-700';
  }
};

const ContactProfileModal: React.FC<ContactProfileModalProps> = ({
  contact,
  isOpen,
  onClose,
  onUpdate,
  mode: initialMode = 'view'
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [editData, setEditData] = useState<Partial<Contact>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isValid, setIsValid] = useState(false);
  
  const { profileData, isLoading } = useContactProfile(contact?.phone || '');

  const normalize = (v?: string) => (v || '').trim();

  const computeHasChanges = (base: Contact | null, current: Partial<Contact>) => {
    if (!base) return false;
    return (
      normalize(current.name) !== normalize(base.name) ||
      normalize(current.sobrenome) !== normalize(base.sobrenome) ||
      normalize(current.cidade) !== normalize(base.cidade) ||
      normalize(current.bairro) !== normalize(base.bairro) ||
      normalize(current.evento) !== normalize(base.evento) ||
      normalize(current.sentimento) !== normalize(base.sentimento)
    );
  };

  const computeIsValid = (base: Contact | null, current: Partial<Contact>) => {
    const nameValue = normalize(current.name ?? base?.name);
    const phoneValue = normalize(base?.phone);
    return Boolean(nameValue.length > 0 && phoneValue.length > 0);
  };

  // Reintroduz util de formatação de separador de dia
  const formatDayLabel = (date: Date) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoje';
    if (diffDays === -1) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  };

  // Reintroduz util para ícones de status de mensagem
  const getStatusIcon = (message: any) => {
    if (!message || message.direction !== 'sent') return null;
    const status = String(message.status || '').toLowerCase();
    const isRead = Boolean(message.read_at);
    if (isRead) return <CheckCheck className="w-3 h-3 text-[#53bdeb]" />;
    if (status.includes('delivered') || status.includes('entregue')) return <CheckCheck className="w-3 h-3 text-gray-500" />;
    return <Check className="w-3 h-3 text-gray-500" />;
  };

  useEffect(() => {
    // Quando abre a janela, sempre força modo visualização e reseta edição
    if (isOpen) {
      setMode('view');
      if (contact) {
        setEditData({
          name: contact.name,
          sobrenome: contact.sobrenome || '',
          cidade: contact.cidade || '',
          bairro: contact.bairro || '',
          evento: contact.evento || '',
          sentimento: contact.sentimento || '',
        });
        setHasChanges(false);
        setIsValid(computeIsValid(contact, {
          name: contact.name,
          sobrenome: contact.sobrenome || '',
          cidade: contact.cidade || '',
          bairro: contact.bairro || '',
          evento: contact.evento || '',
          sentimento: contact.sentimento || '',
        }));
      } else {
        setEditData({});
        setHasChanges(false);
        setIsValid(false);
      }
    }
  }, [isOpen, contact]);

  useEffect(() => {
    // Recalcula mudanças e validação quando editData ou contato alteram
    setHasChanges(computeHasChanges(contact, editData));
    setIsValid(computeIsValid(contact, editData));
  }, [editData, contact]);

  if (!contact) return null;

  const handleSave = () => {
    if (!onUpdate) {
      setMode('view');
      return;
    }
    if (mode !== 'edit' || !hasChanges || !isValid) return;
    onUpdate({ ...contact, ...editData });
    setMode('view');
  };

  const handleCancel = () => {
    setEditData({
      name: contact.name,
      sobrenome: contact.sobrenome || '',
      cidade: contact.cidade || '',
      bairro: contact.bairro || '',
      evento: contact.evento || '',
      sentimento: contact.sentimento || '',
    });
    setHasChanges(false);
    setIsValid(computeIsValid(contact, {
      name: contact.name,
      sobrenome: contact.sobrenome || '',
      cidade: contact.cidade || '',
      bairro: contact.bairro || '',
      evento: contact.evento || '',
      sentimento: contact.sentimento || '',
    }));
    setMode('view');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {contact.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{contact.name}</h2>
                <p className="text-sm text-muted-foreground">{contact.phone}</p>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-2">
              {mode === 'view' ? (
                <Button variant="outline" size="sm" onClick={() => setMode('edit')}>
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={mode !== 'edit' || !hasChanges || !isValid}>
                    <Save className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
          </TabsList>
          {/* Contêiner com altura fixa para manter tamanho consistente entre abas */}
          <div className="h-[560px] overflow-y-auto mt-4">
          <TabsContent value="profile" className="space-y-6 h-full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    {mode === 'edit' ? (
                      <Input
                        id="name"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{contact.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="sobrenome">Sobrenome</Label>
                    {mode === 'edit' ? (
                      <Input
                        id="sobrenome"
                        value={editData.sobrenome || ''}
                        onChange={(e) => setEditData({ ...editData, sobrenome: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{contact.sobrenome || 'Não informado'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{contact.phone}</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sentimento">Sentimento</Label>
                    {mode === 'edit' ? (
                      <Select
                        value={editData.sentimento || ''}
                        onValueChange={(value) => setEditData({ ...editData, sentimento: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o sentimento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Super Engajado">Super Engajado</SelectItem>
                          <SelectItem value="Positivo">Positivo</SelectItem>
                          <SelectItem value="Neutro">Neutro</SelectItem>
                          <SelectItem value="Negativo">Negativo</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">
                        {contact.sentimento ? (
                          <Badge className={getSentimentColor(contact.sentimento)}>
                            {contact.sentimento}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Não classificado</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    {mode === 'edit' ? (
                      <Input
                        id="cidade"
                        value={editData.cidade || ''}
                        onChange={(e) => setEditData({ ...editData, cidade: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{contact.cidade || 'Não informado'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="bairro">Bairro</Label>
                    {mode === 'edit' ? (
                      <Input
                        id="bairro"
                        value={editData.bairro || ''}
                        onChange={(e) => setEditData({ ...editData, bairro: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{contact.bairro || 'Não informado'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="evento">Evento</Label>
                  {mode === 'edit' ? (
                    <Input
                      id="evento"
                      value={editData.evento || ''}
                      onChange={(e) => setEditData({ ...editData, evento: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{contact.evento || 'Não informado'}</p>
                  )}
                </div>
                <div>
                  <Label>Responsável pelo Cadastro</Label>
                  <p className="text-sm font-medium mt-1">{contact.responsavel_cadastro || 'Sistema'}</p>
                </div>
                <div>
                  <Label>Status de Envio</Label>
                  <Badge variant="outline" className="mt-1">
                    {contact.status_envio || 'Indefinido'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="h-full">
            <Card>
              <CardHeader>
                <CardTitle>Participação em Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Carregando dados...</p>
                ) : profileData?.events?.length ? (
                  <div className="space-y-3">
                    {profileData.events.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{event.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant="outline">{event.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma participação em eventos encontrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="h-full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Histórico de Mensagens
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Carregando mensagens...</p>
                ) : profileData?.messages?.length ? (
                  <div className="space-y-2">
                    <div className="max-h-[480px] overflow-y-auto p-3 rounded-md bg-[#efeae2]">
                      {(() => {
                        const sorted = profileData.messages
                          .slice()
                          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                        const nodes: JSX.Element[] = [];
                        let lastDayKey = '';
                        sorted.forEach((message, index) => {
                          const msgDate = new Date(message.created_at);
                          const dayKey = `${msgDate.getFullYear()}-${msgDate.getMonth()}-${msgDate.getDate()}`;
                          if (dayKey !== lastDayKey) {
                            nodes.push(
                              <div key={`sep-${dayKey}-${index}`} className="flex justify-center my-2">
                                <span className="px-3 py-1 text-xs rounded-full bg-[#d1d7db] text-[#1f2c34]">
                                  {formatDayLabel(msgDate)}
                                </span>
                              </div>
                            );
                            lastDayKey = dayKey;
                          }
                          const isSent = message.direction === 'sent';
                          const timeLabel = msgDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          nodes.push(
                            <div key={message.id || index} className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-1`}>
                              <div
                                className={
                                  `${isSent ?
                                    'bg-[#dcf8c6] after:border-l-[#dcf8c6] after:right-0 after:translate-x-2' :
                                    'bg-white after:border-r-white after:left-0 after:-translate-x-2'} ` +
                                  'relative max-w-[75%] px-3 py-2 rounded-2xl shadow-sm text-[15px] text-[#111b21] ' +
                                  'after:content-[""] after:absolute after:bottom-0 after:w-0 after:h-0 after:border-t-[12px] after:border-t-transparent'
                                }
                              >
                                <p className="whitespace-pre-wrap break-words leading-snug">{message.message_content || 'Conteúdo indisponível'}</p>
                                <div className={`mt-1 flex items-center gap-1 ${isSent ? 'justify-end' : 'justify-end'}`}>
                                  <span className="text-[11px] text-[#667781]">{timeLabel}</span>
                                  {isSent && (
                                    <span className="flex items-center">{getStatusIcon(message)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        });
                        return <>{nodes}</>;
                      })()}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma mensagem encontrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ContactProfileModal;