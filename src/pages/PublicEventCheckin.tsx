import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, CheckCircle, Loader2, Calendar as CalendarIcon, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DDI_OPTIONS, combineDDIAndPhone, formatPhoneBR, formatBirthday, isValidBRPhone } from '@/lib/phoneUtils';
import { filterPositions } from '@/lib/positions';

const PublicEventCheckin = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  
  // Form state
  const [nome, setNome] = useState('');
  const [ddi, setDdi] = useState('+55');
  const [celular, setCelular] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [cargo, setCargo] = useState('');
  const [cargoSearch, setCargoSearch] = useState('');
  const [cargoOpen, setCargoOpen] = useState(false);
  const [dataAniversario, setDataAniversario] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch event by slug
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
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

  // Filter positions based on search
  const filteredPositions = useMemo(() => {
    return filterPositions(cargoSearch || cargo);
  }, [cargoSearch, cargo]);

  // Perform check-in mutation
  const checkinMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('Evento não encontrado');
      
      // Validate required fields
      if (!nome.trim()) throw new Error('Nome é obrigatório');
      if (!celular.trim()) throw new Error('Telefone é obrigatório');
      if (!isValidBRPhone(celular)) throw new Error('Telefone inválido. Use formato: (DD) XXXXX-XXXX');
      
      const fullPhone = combineDDIAndPhone(ddi, celular);
      
      // Upsert contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .upsert(
          {
            phone: fullPhone,
            name: nome,
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

      // Get last used instance for this contact
      const { data: lastMessage } = await supabase
        .from('mensagens_enviadas')
        .select('instancia_id')
        .eq('celular', fullPhone)
        .eq('organization_id', event.organization_id)
        .order('data_envio', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      const lastInstanceId = lastMessage?.instancia_id || null;

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

      // Insert message in queue
      const { error: messageError } = await supabase
        .from('mensagens_checkin_eventos')
        .insert({
          tipo_fluxo: 'evento',
          event_id: event.id,
          contact_id: contact.id,
          checkin_id: checkin.id,
          celular: fullPhone,
          mensagem: messageText,
          url_midia: event.message_image || null,
          tipo_midia: event.media_type || null,
          instancia_id: lastInstanceId,
          status: 'fila',
          organization_id: event.organization_id,
        });

      if (messageError) throw messageError;

      return checkin;
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Check-in realizado com sucesso!');
      // Reset form
      setNome('');
      setCelular('');
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
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
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

            {/* Cidade e Bairro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Sua cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Seu bairro"
                />
              </div>
            </div>

            {/* Cargo com Autocomplete */}
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo/Função</Label>
              <Popover open={cargoOpen} onOpenChange={setCargoOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={cargoOpen}
                    className="w-full justify-between"
                  >
                    {cargo || "Selecione ou digite seu cargo..."}
                    <Briefcase className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Pesquisar cargo..." 
                      value={cargoSearch}
                      onValueChange={setCargoSearch}
                    />
                    <CommandEmpty>
                      <div className="p-2 text-sm text-muted-foreground">
                        Nenhum cargo encontrado. 
                        {cargoSearch && (
                          <Button
                            variant="ghost"
                            className="w-full mt-2"
                            onClick={() => {
                              setCargo(cargoSearch);
                              setCargoOpen(false);
                            }}
                          >
                            Usar "{cargoSearch}"
                          </Button>
                        )}
                      </div>
                    </CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {filteredPositions.slice(0, 50).map((position) => (
                        <CommandItem
                          key={position}
                          value={position}
                          onSelect={(currentValue) => {
                            setCargo(currentValue);
                            setCargoOpen(false);
                            setCargoSearch('');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              cargo === position ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {position}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
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
