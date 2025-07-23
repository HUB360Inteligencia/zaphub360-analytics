
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, Users, Send, FileText, BarChart3, 
  Settings, Bell, Search, Menu, X, MessageSquare,
  Zap, Target, Calendar, HelpCircle, LogOut, MessageCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { profile, organization, signOut } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, current: location.pathname === '/' },
    { name: 'Contatos', href: '/contacts', icon: Users, current: location.pathname === '/contacts' },
    { name: 'Campanhas', href: '/campaigns', icon: Send, current: location.pathname === '/campaigns' },
    { name: 'Conteúdo de Mensagem', href: '/message-content', icon: MessageCircle, current: location.pathname === '/message-content' },
    { name: 'Eventos', href: '/events', icon: Calendar, current: location.pathname.startsWith('/events') },
    { name: 'Relatórios', href: '/reports', icon: BarChart3, current: location.pathname === '/reports' },
  ];

  const quickActions = [
    { name: 'Nova Campanha', icon: Zap, color: 'bg-blue-600' },
    { name: 'Novo Contato', icon: Users, color: 'bg-green-600' },
    { name: 'Novo Template', icon: FileText, color: 'bg-purple-600' },
  ];

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">G360-Wpp</h1>
                <p className="text-xs text-slate-500">{organization?.name || 'CRM & Automação'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  {item.name}
                  {item.name === 'Campanhas' && (
                    <Badge className="ml-auto bg-green-100 text-green-800 text-xs">0</Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="px-4 py-4 border-t">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Ações Rápidas
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <Button
                    key={action.name}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                  >
                    <div className={`w-4 h-4 rounded mr-2 flex items-center justify-center ${action.color}`}>
                      <IconComponent className="w-3 h-3 text-white" />
                    </div>
                    {action.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* User Profile */}
          <div className="px-4 py-4 border-t">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {profile?.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'lg:ml-64' : ''} transition-all duration-300`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-600"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar contatos, campanhas..."
                  className="pl-10 pr-4 py-2 w-80 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500"></Badge>
              </Button>

              {/* Help */}
              <Button variant="ghost" size="sm">
                <HelpCircle className="w-5 h-5 text-slate-600" />
              </Button>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 text-slate-600" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
