import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import laravelClient, { User, Profile } from '@/integrations/laravel/client';
import { getApiErrorMessage } from '@/lib/api-error';

type AppRole = 'super_admin' | 'admin' | 'technician' | 'requester';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, telegram?: string) => Promise<{ error: Error | null; isPending?: boolean; message?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await laravelClient.get('/user');
      const userData = response.data.user;

      setUser(userData);
      setProfile(userData.profile);

      // Extract role from roles array (assuming single role for now)
      const userRole = userData.roles && userData.roles.length > 0
        ? userData.roles[0].name as AppRole
        : 'requester';

      setRole(userRole);
    } catch (error) {
      console.error('Error checking auth:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Token-based auth doesn't need CSRF cookie


      const response = await laravelClient.post('/login', {
        email,
        password,
      });

      const { token, user: userData } = response.data;

      localStorage.setItem('auth_token', token);

      setUser(userData);
      setProfile(userData.profile);

      const userRole = userData.roles && userData.roles.length > 0
        ? userData.roles[0].name as AppRole
        : 'requester';

      setRole(userRole);

      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return {
        error: new Error(getApiErrorMessage(error, 'Failed to sign in'))
      };
    }
  };

  const signUp = async (email: string, password: string, name: string, telegram?: string) => {
    try {


      const response = await laravelClient.post('/register', {
        name,
        email,
        password,
        password_confirmation: password,
        telegram_username: telegram,
      });

      // Check if user is pending approval (no token returned)
      if (response.data.status === 'pending') {
        return {
          error: null,
          isPending: true,
          message: response.data.message
        };
      }

      // Normal registration flow (if admin creates user with active status)
      const { token, user: userData } = response.data;

      localStorage.setItem('auth_token', token);

      setUser(userData);
      setProfile(userData.profile);

      const userRole = userData.roles && userData.roles.length > 0
        ? userData.roles[0].name as AppRole
        : 'requester';

      setRole(userRole);

      return { error: null, isPending: false };
    } catch (error) {
      console.error('Error signing up:', error);
      return {
        error: new Error(getApiErrorMessage(error, 'Failed to sign up')),
        isPending: false
      };
    }
  };

  const signOut = async () => {
    try {
      await laravelClient.post('/logout');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      setProfile(null);
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
