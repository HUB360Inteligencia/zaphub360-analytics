import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  organization_id: string | null;
  role: string | null;
  is_active: boolean;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setProfile(profileData);

      // Fetch organization if user has one
      if (profileData.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .single();

        if (orgError) {
          console.error('Error fetching organization:', orgError);
        } else {
          setOrganization(orgData);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const handleNewUser = async (user: User) => {
    try {
      // Create organization first
      const organizationName = user.user_metadata?.organization_name || `${user.user_metadata?.full_name}'s Organization`;
      const orgSlug = organizationName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          slug: orgSlug,
          is_active: true,
        })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        toast.error('Erro ao criar organização');
        return;
      }

      // Update user profile with organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          organization_id: orgData.id,
          role: 'client',
          full_name: user.user_metadata?.full_name || null,
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        toast.error('Erro ao configurar perfil');
        return;
      }

      // Refresh profile data
      await fetchProfile(user.id);
      toast.success('Conta configurada com sucesso!');
    } catch (error) {
      console.error('Error in handleNewUser:', error);
      toast.error('Erro ao configurar conta');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Erro ao fazer logout');
      } else {
        toast.success('Logout realizado com sucesso');
      }
    } catch (error) {
      toast.error('Erro inesperado ao fazer logout');
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Check if this is a new user (just signed up)
          if (event === 'SIGNED_IN') {
            // For new signups, we'll handle this in the profile creation
            setTimeout(() => {
              fetchProfile(session.user.id);
            }, 100);
          } else {
            // Existing user, fetch profile
            setTimeout(() => {
              fetchProfile(session.user.id);
            }, 100);
          }
        } else {
          // No session, clear profile data
          setProfile(null);
          setOrganization(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    profile,
    organization,
    loading,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
