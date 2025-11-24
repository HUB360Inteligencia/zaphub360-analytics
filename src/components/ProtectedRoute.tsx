
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'saas_admin' | 'client' | 'manager' | 'agent' | 'viewer' | 'guest';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [roleChecking, setRoleChecking] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!loading && !user) {
        navigate('/auth');
        return;
      }

      if (!loading && user && requiredRole) {
        setRoleChecking(true);
        
        // Verificação server-side usando função SECURITY DEFINER
        const { data, error } = await supabase
          .rpc('has_role', { 
            _user_id: user.id, 
            _role: requiredRole 
          });

        if (error) {
          console.error('Error checking role:', error);
          setHasPermission(false);
        } else {
          setHasPermission(data === true);
        }

        setRoleChecking(false);

        // Se não tiver permissão, redirecionar
        if (data !== true) {
          navigate('/');
        }
      } else if (!loading && user && !requiredRole) {
        // Se não precisa de role específica, liberar acesso
        setHasPermission(true);
      }
    };

    checkPermissions();
  }, [user, loading, navigate, requiredRole]);

  if (loading || roleChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-foreground">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  if (requiredRole && hasPermission === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-foreground">Acesso negado. Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
