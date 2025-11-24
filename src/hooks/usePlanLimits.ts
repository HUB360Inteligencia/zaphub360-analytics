import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePlanLimits = () => {
  const { organization } = useAuth();

  const checkLimit = async (
    type: 'contacts' | 'events' | 'messages'
  ): Promise<boolean> => {
    if (!organization?.id) {
      toast.error('Organização não encontrada');
      return false;
    }

    try {
      const funcName = type === 'contacts' ? 'can_create_contact' 
        : type === 'events' ? 'can_create_event' 
        : 'can_send_message';
      
      const { data, error } = await supabase.rpc(funcName, {
        org_id: organization.id
      });

      if (error) {
        console.error(`Erro ao verificar limite de ${type}:`, error);
        toast.error(`Erro ao verificar limite de ${type}`);
        return false;
      }

      if (!data) {
        const limitNames = {
          contacts: 'contatos',
          events: 'eventos',
          messages: 'mensagens'
        };
        toast.error(
          `Limite de ${limitNames[type]} atingido no seu plano atual`,
          {
            description: 'Entre em contato para fazer upgrade do seu plano'
          }
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar limites:', error);
      return false;
    }
  };

  return { checkLimit };
};
