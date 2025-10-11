import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MessageSquare, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação de senha obrigatória'),
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  organizationName: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});
type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const [inviteTokenParam, setInviteTokenParam] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{
    email: string;
    organizationName: string;
    role: string;
    token: string;
  } | null>(null);
  const instanceId = useState(() => Math.random().toString(36).slice(2))[0];
  const navigate = useNavigate();
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    shouldUnregister: true,
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    shouldUnregister: true,
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      organizationName: ''
    }
  });
  useEffect(() => {
    console.info('Auth page mounted', { instanceId });
    
    const inviteToken = searchParams.get('invite_token');
    if (inviteToken) {
      // Forçar modo registro quando há convite
      setIsLogin(false);
      setInviteTokenParam(inviteToken);

      // Se usuário já estiver logado, aceitar convite imediatamente usando o token do link
      (async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          try {
            const { data: acceptResult, error: acceptError } = await supabase.rpc('accept_invitation', {
              p_token: inviteToken,
              p_user_id: sessionData.session.user.id
            });
            if (acceptError) {
              console.error('Erro ao aceitar convite automaticamente (useEffect):', acceptError);
              toast.error('Não foi possível aceitar o convite automaticamente.');
            } else if (acceptResult?.success) {
              toast.success('Convite aceito! Você foi adicionado à organização.');
              navigate('/');
              return;
            } else {
              toast.error(acceptResult?.error || 'Falha ao aceitar convite');
            }
          } catch (e) {
            console.error('Exceção ao aceitar convite automaticamente (useEffect):', e);
          }
        }
      })();
      loadInviteData(inviteToken);
    }
    
    return () => console.info('Auth page unmounted', { instanceId });
  }, []);

  const loadInviteData = async (token: string) => {
    try {
      // Usar RPC seguro para obter dados do convite por token
      const { data, error } = await supabase.rpc('get_invitation_by_token', { p_token: token });
      
      if (error || !data || data.length === 0) {
        toast.error('Convite inválido ou expirado');
        return;
      }
      
      // Se já houver usuário logado, aceitar o convite imediatamente
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        try {
          const { data: acceptResult, error: acceptError } = await supabase.rpc('accept_invitation', {
            p_token: token,
            p_user_id: sessionData.session.user.id
          });
          if (acceptError) {
            console.error('Erro ao aceitar convite automaticamente:', acceptError);
            toast.error('Não foi possível aceitar o convite automaticamente. Tente novamente.');
          } else if (acceptResult?.success) {
            toast.success('Convite aceito! Você foi adicionado à organização.');
            navigate('/');
            return; // Evitar mudar UI para registro se já aceitou
          } else {
            toast.error(acceptResult?.error || 'Falha ao aceitar convite');
          }
        } catch (e) {
          console.error('Exceção ao aceitar convite automaticamente:', e);
        }
      }

      const invite = (data as any[])[0];
      setInviteData({
        email: invite.email,
        organizationName: invite.organization_name || 'Organização',
        role: invite.role,
        token: invite.token
      });
      setIsLogin(false);
      registerForm.setValue('email', invite.email);
    } catch (error) {
      console.error('Erro ao carregar convite:', error);
      toast.error('Erro ao carregar convite');
    }
  };
  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success('Login realizado com sucesso!');

      // Se houve invite_token carregado, aceitar convite após login
      const tokenToAccept = inviteData?.token ?? inviteTokenParam;
      if (tokenToAccept) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData?.user?.id;
          if (userId) {
            const { data: acceptResult, error: acceptError } = await supabase.rpc('accept_invitation', {
              p_token: tokenToAccept,
              p_user_id: userId
            });
            if (acceptError) {
              console.error('Erro ao aceitar convite após login:', acceptError);
              toast.error('Não foi possível aceitar o convite após login.');
            } else if (acceptResult?.success) {
              toast.success('Convite aceito! Você foi adicionado à organização.');
            } else {
              toast.error(acceptResult?.error || 'Falha ao aceitar convite');
            }
          }
        } catch (e) {
          console.error('Exceção ao aceitar convite após login:', e);
        }
      }

      navigate('/');
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const signUpData: any = {
        email: inviteData ? inviteData.email : data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: data.fullName,
          }
        }
      };
      
      const tokenForSignup = inviteData?.token ?? inviteTokenParam;
      if (tokenForSignup) {
        signUpData.options.data.invite_token = tokenForSignup;
      } else {
        if (!data.organizationName) {
          toast.error('Nome da organização é obrigatório');
          return;
        }
        signUpData.options.data.organization_name = data.organizationName;
      }
      
      const { error } = await supabase.auth.signUp(signUpData);

      if (error) {
        const lowerMsg = (error.message || '').toLowerCase();
        // Mensagem explícita quando cadastro falhar por ausência de invite_token
        if (
          lowerMsg.includes('registration requires invite token') ||
          lowerMsg.includes('invite token') ||
          lowerMsg.includes('requires invite')
        ) {
          toast.error('Cadastro fechado: é necessário convite. Solicite acesso.');
          toast.info('Use “Solicitar Acesso” para pedir um convite.');
        } else if (lowerMsg.includes('user already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      if (inviteData) {
        toast.success('Conta criada! Você foi adicionado à organização.');
      } else {
        toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      }
      setIsLogin(true);
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center">
              <img src="/logo.png" alt="ZapHub360 Logo" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ZapHub360</h1>
              <p className="text-sm text-slate-500">CRM & Automação</p>
            </div>
          </div>
          <div>
            <CardTitle className="text-xl">
              {isLogin ? 'Fazer Login' : 'Criar Conta'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Entre com suas credenciais para acessar o sistema'
                : (inviteData || inviteTokenParam)
                  ? 'Finalize seu cadastro para aceitar o convite'
                  : 'Cadastro fechado. Solicite acesso para criar uma conta.'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {inviteData && !isLogin && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Você foi convidado para <strong>{inviteData.organizationName}</strong>
                <br />
                <span className="text-sm text-blue-600">Complete seu cadastro para aceitar o convite</span>
              </AlertDescription>
            </Alert>
          )}
          
          {isLogin ? <Form key="login" {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField control={loginForm.control} name="email" render={({
              field
            }) => <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" autoFocus placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={loginForm.control} name="password" render={({
              field
            }) => <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={showPassword ? 'text' : 'password'} 
                            placeholder="••••••••" 
                            autoComplete="current-password"
                            className="pr-10" 
                            {...field} 
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-slate-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>} />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </Form> : <Form key="register" {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <FormField control={registerForm.control} name="fullName" render={({
              field
            }) => <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

 {!(inviteData || inviteTokenParam) && (
                  <FormField control={registerForm.control} name="organizationName" render={({
                    field
                  }) => <FormItem>
                        <FormLabel>Nome da Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Minha Empresa Ltda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                )}

                <FormField control={registerForm.control} name="email" render={({
              field
            }) => <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="seu@email.com" 
                          disabled={!!inviteData}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={registerForm.control} name="password" render={({
              field
            }) => <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? 'text' : 'password'} 
                            placeholder="••••••••" 
                            autoComplete="new-password"
                            className="pr-10"
                            {...field} 
                          />
                          <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={registerForm.control} name="confirmPassword" render={({
              field
            }) => <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          autoComplete="new-password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                {(inviteData || inviteTokenParam) ? (
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Conta
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button type="button" className="w-full" onClick={() => window.location.href = '/request-access'}>
                      Solicitar Acesso
                    </Button>
                    <p className="text-xs text-slate-500 text-center">
                      O cadastro é restrito e requer convite. Solicite acesso para prosseguir.
                    </p>
                  </div>
                )}
              </form>
            </Form>}

          <div className="text-center">
            <Button variant="link" onClick={() => {
              setIsLogin(!isLogin);
              setShowPassword(false);
              // Clear all form fields manually when switching between login and register
              if (!isLogin) {
                // Switching to login - clear login form
                loginForm.setValue('email', '');
                loginForm.setValue('password', '');
              } else {
                // Switching to register - clear register form
                registerForm.setValue('email', '');
                registerForm.setValue('password', '');
                registerForm.setValue('confirmPassword', '');
                registerForm.setValue('fullName', '');
                registerForm.setValue('organizationName', '');
              }
            }} className="text-sm">
              {isLogin ? (
                <>Não tem uma conta? <span className="font-semibold">Solicite acesso</span></>
              ) : (
                <>Já tem uma conta? <span className="font-semibold">Faça login</span></>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;