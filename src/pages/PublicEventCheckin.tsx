import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DDI_OPTIONS, combineDDIAndPhone, formatPhoneBR, formatBirthday, isValidBRPhone } from '@/lib/phoneUtils';
import { PositionCombobox } from '@/components/events/PositionCombobox';
import { CityCombobox } from '@/components/events/CityCombobox';
import { BairroCombobox } from '@/components/events/BairroCombobox';

// Extended event type with additional fields needed for check-in
interface EventWithCheckinFields {
  id: string;
  event_id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  message_text: string;
  message_image: string | null;
  media_type: string | null;
  organization_id: string;
  status: string;
  tempo_min?: number | null;
  tempo_max?: number | null;
  image_filename?: string | null;
  mime_type?: string | null;
  id_tipo_mensagem?: number | null;
}

const PublicEventCheckin = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  
  // Form state
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [ddi, setDdi] = useState('+55');
  const [celular, setCelular] = useState('');
  const [estado, setEstado] = useState('PR');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [cargo, setCargo] = useState('');
  const [dataAniversario, setDataAniversario] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch event by slug
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery<EventWithCheckinFields>({
    queryKey: ['public-event', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug não fornecido');
      
      const { data, error } = await supabase.rpc('get_event_by_slug', {
        event_slug: slug
      });
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Evento não encontrado');
      
      return data[0];
    },
    enabled: !!slug,
  });

  // Perform check-in mutation
  const checkinMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('Evento não encontrado');
      
      // Validate required fields
      if (!nome.trim()) throw new Error('Nome é obrigatório');
      if (!celular.trim()) throw new Error('Telefone é obrigatório');
      if (!isValidBRPhone(celular)) throw new Error('Telefone inválido. Use formato: (DD) XXXXX-XXXX');
      
      const fullPhone = combineDDIAndPhone(ddi, celular);
      
      // Concatenate nome + sobrenome for full name
      const fullName = sobrenome ? `${nome} ${sobrenome}` : nome;
      
      // Upsert contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .upsert(
          {
            phone: fullPhone,
            name: fullName,
            organization_id: event.organization_id,
            origin: 'checkin_evento',
            status: 'active',
          },
          {
            onConflict: 'organization_id,phone',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (contactError) throw contactError;
      if (!contact) throw new Error('Erro ao criar/atualizar contato');

      // Get instance: first from new_contact_event, then from event instances
      const { data: existingContact } = await supabase
        .from('new_contact_event')
        .select('ultima_instancia')
        .eq('celular', fullPhone)
        .eq('organization_id', event.organization_id)
        .maybeSingle();

      let instanceId = existingContact?.ultima_instancia || null;

      // If no instance, get from event configuration
      if (!instanceId) {
        const { data: eventInstance } = await supabase
          .from('campanha_instancia')
          .select('id_instancia')
          .eq('id_evento', event.id)
          .order('prioridade')
          .limit(1)
          .maybeSingle();
        
        instanceId = eventInstance?.id_instancia || null;
      }

      // Insert check-in
      const { data: checkin, error: checkinError } = await supabase
        .from('checkins_evento')
        .insert({
          event_id: event.id,
          contact_id: contact.id,
          nome: nome,
          celular: fullPhone,
          bairro: bairro || null,
          cidade: cidade || null,
          cargo: cargo || null,
          data_aniversario_text: dataAniversario.replace(/\D/g, '') || null,
          organization_id: event.organization_id,
        })
        .select()
        .single();

      if (checkinError) throw checkinError;

      // Insert/Update contact in event contacts table with history
      const { data: eventContactId, error: eventContactError } = await supabase
        .rpc('upsert_new_contact_event_min', {
          _name: nome,
          _celular: fullPhone,
          _evento: event.name,
          _sobrenome: sobrenome || '',
          _organization_id: event.organization_id,
          _perfil_contato: cargo || '',
        });

      if (eventContactError) {
        console.error('Erro ao atualizar contato do evento:', eventContactError);
      }

      // Update additional event contact fields
      if (eventContactId) {
        await supabase
          .from('new_contact_event')
          .update({
            bairro: bairro || null,
            cidade: cidade || null,
            ultima_instancia: instanceId,
            responsavel_cadastro: 'check-in público',
            event_id: event.event_id ? parseInt(event.event_id) : null,
          })
          .eq('id_contact_event', eventContactId)
          .eq('organization_id', event.organization_id);
      }

      // Render message with placeholders
      let messageText = event.message_text;
      const placeholders: Record<string, string> = {
        '{{nome}}': nome,
        '{{bairro}}': bairro || '',
        '{{cidade}}': cidade || '',
        '{{cargo}}': cargo || '',
        '{{data_aniversario_text}}': dataAniversario || '',
        '{{nome_evento}}': event.name,
        '{{data_evento}}': event.event_date
          ? new Date(event.event_date).toLocaleDateString('pt-BR')
          : '',
      };

      Object.entries(placeholders).forEach(([key, value]) => {
        messageText = messageText.replace(new RegExp(key, 'g'), value);
      });

      // Calculate random delay between tempo_min and tempo_max
      const tempoMin = event.tempo_min || 30;
      const tempoMax = event.tempo_max || 60;
      const delay = Math.floor(Math.random() * (tempoMax - tempoMin + 1)) + tempoMin;

      // Insert message in mensagens_enviadas
      const { error: messageError } = await supabase
        .from('mensagens_enviadas')
        .insert({
          tipo_fluxo: 'evento',
          id_campanha: event.id,
          celular: fullPhone,
          mensagem: messageText,
          nome_contato: nome,
          perfil_contato: cargo || null,
          url_media: event.message_image || null,
          media_type: event.media_type || null,
          name_media: event.image_filename || null,
          mime_type: event.mime_type || null,
          caption_media: messageText,
          instancia_id: instanceId,
          status: 'pendente',
          organization_id: event.organization_id,
          id_tipo_mensagem: event.id_tipo_mensagem || 1,
          'tempo delay': delay,
        });

      if (messageError) throw messageError;

      return checkin;
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Check-in realizado com sucesso!');
      // Reset form
      setNome('');
      setSobrenome('');
      setCelular('');
      setEstado('PR');
      setBairro('');
      setCidade('');
      setCargo('');
      setDataAniversario('');
    },
    onError: (error: any) => {
      console.error('Erro ao realizar check-in:', error);
      toast.error(error.message || 'Erro ao realizar check-in');
    },
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneBR(e.target.value);
    setCelular(formatted);
  };

  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBirthday(e.target.value);
    setDataAniversario(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkinMutation.mutate();
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Evento não encontrado</CardTitle>
            <CardDescription>
              O evento que você está procurando não existe ou não está mais ativo.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check-in Confirmado!</CardTitle>
            <CardDescription>
              Obrigado por se cadastrar em <strong>{event.name}</strong>. 
              Em breve você receberá uma mensagem de confirmação.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setIsSuccess(false)} variant="outline" className="w-full">
              Fazer outro check-in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl">{event.name}</CardTitle>
          <CardDescription>
            Preencha o formulário abaixo para realizar seu check-in
            {event.event_date && (
              <> • {new Date(event.event_date).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome e Sobrenome */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Primeiro nome"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sobrenome">Sobrenome</Label>
                <Input
                  id="sobrenome"
                  value={sobrenome}
                  onChange={(e) => setSobrenome(e.target.value)}
                  placeholder="Sobrenome"
                />
              </div>
            </div>

            {/* Telefone com DDI */}
            <div className="space-y-2">
              <Label htmlFor="celular">Telefone *</Label>
              <div className="flex gap-2">
                <Select value={ddi} onValueChange={setDdi}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DDI_OPTIONS.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.flag} {option.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="celular"
                  value={celular}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-8888"
                  className="flex-1"
                  required
                />
              </div>
            </div>

            {/* Cidade com busca IBGE */}
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <CityCombobox
                value={cidade}
                onChange={setCidade}
                stateUF={estado}
                onStateChange={setEstado}
                defaultState="PR"
              />
            </div>

            {/* Bairro com busca histórica */}
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <BairroCombobox
                value={bairro}
                onChange={setBairro}
                cidade={cidade}
                organizationId={event.organization_id}
              />
            </div>

            {/* Cargo com Autocomplete */}
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo/Função</Label>
              <PositionCombobox 
                value={cargo}
                onChange={setCargo}
                eventId={event?.id}
              />
              <p className="text-xs text-muted-foreground">
                Selecione ou crie um cargo. Algumas opções podem estar restritas pelo organizador.
              </p>
            </div>

            {/* Data de Aniversário */}
            <div className="space-y-2">
              <Label htmlFor="data-aniversario">Data de Aniversário</Label>
              <div className="relative">
                <Input
                  id="data-aniversario"
                  value={dataAniversario}
                  onChange={handleBirthdayChange}
                  placeholder="12/03/1990 ou 12/03"
                  maxLength={10}
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={checkinMutation.isPending}
            >
              {checkinMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Realizando check-in...
                </>
              ) : (
                'Confirmar Check-in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicEventCheckin;
