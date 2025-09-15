import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MessageSquare, Loader2, Eye, EyeOff } from 'lucide-react';
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
  organizationName: z.string().min(2, 'Nome da organização deve ter pelo menos 2 caracteres')
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
  const instanceId = useState(() => Math.random().toString(36).slice(2))[0];
  const navigate = useNavigate();
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    shouldUnregister: false,
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    shouldUnregister: false,
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
    return () => console.info('Auth page unmounted', { instanceId });
  }, []);
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
      const {
        error
      } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: data.fullName,
            organization_name: data.organizationName
          }
        }
      });
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
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
              {isLogin ? 'Entre com suas credenciais para acessar o sistema' : 'Crie sua conta e comece a usar o G360-Wpp'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLogin ? <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField control={loginForm.control} name="email" render={({
              field
            }) => <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} onChange={(e) => { console.info('login.email change', e.target.value, { instanceId }); field.onChange(e); }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={loginForm.control} name="password" render={({
              field
            }) => <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pr-10" {...field} onChange={(e) => { console.info('login.password change', e.target.value, { instanceId }); field.onChange(e); }} />
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
            </Form> : <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <FormField control={registerForm.control} name="fullName" render={({
              field
            }) => <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="João Silva" {...field} onChange={(e) => { console.info('register.fullName change', e.target.value, { instanceId }); field.onChange(e); }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={registerForm.control} name="organizationName" render={({
              field
            }) => <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Minha Empresa Ltda" {...field} onChange={(e) => { console.info('register.organizationName change', e.target.value, { instanceId }); field.onChange(e); }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={registerForm.control} name="email" render={({
              field
            }) => <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} onChange={(e) => { console.info('register.email change', e.target.value, { instanceId }); field.onChange(e); }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={registerForm.control} name="password" render={({
              field
            }) => <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} onChange={(e) => { console.info('register.password change', e.target.value, { instanceId }); field.onChange(e); }} />
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
                        <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} onChange={(e) => { console.info('register.confirmPassword change', e.target.value, { instanceId }); field.onChange(e); }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Conta
                </Button>
              </form>
            </Form>}

          <div className="text-center">
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-sm">
              {isLogin ? <>Não tem uma conta? <span className="font-semibold">Cadastre-se</span></> : <>Já tem uma conta? <span className="font-semibold">Faça login</span></>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;