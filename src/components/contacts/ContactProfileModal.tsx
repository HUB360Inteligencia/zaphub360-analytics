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
import { Phone, Mail, MapPin, Calendar, MessageSquare, Edit, Save, X, User, Building2 } from 'lucide-react';
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
  mode: initialMode
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [editData, setEditData] = useState<Partial<Contact>>({});
  
  const { profileData, isLoading } = useContactProfile(contact?.phone || '');

  useEffect(() => {
    if (contact) {
      setEditData({
        name: contact.name,
        sobrenome: contact.sobrenome || '',
        cidade: contact.cidade || '',
        bairro: contact.bairro || '',
        evento: contact.evento || '',
        sentimento: contact.sentimento || '',
      });
    }
  }, [contact]);

  if (!contact) return null;

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({ ...contact, ...editData });
    }
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
    setMode('view');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                  <Button size="sm" onClick={handleSave}>
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

          <TabsContent value="profile" className="space-y-6">
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

          <TabsContent value="events">
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

          <TabsContent value="messages">
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
                  <div className="space-y-3">
                    {profileData.messages.map((message, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{message.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm">{message.message_content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma mensagem encontrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ContactProfileModal;