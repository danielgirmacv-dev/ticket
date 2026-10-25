import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import laravelClient, { User, Profile } from '@/integrations/laravel/client';
import { getApiErrorMessage } from '@/lib/api-error';
import { toAuthUserMessage } from '@/lib/auth-messages';

type AppRole = 'super_admin' | 'admin' | 'technician' | 'requester';
type SupportCategory = 'it_support' | 'sap' | 'general' | null;

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  supportCategory: SupportCategory;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, telegram?: string, phone?: string) => Promise<{
    error: Error | null;
    isPending?: boolean;
    message?: string;
    autoApproveAfterMinutes?: number | null;
    supportEmail?: string;
    telegramBotUsername?: string | null;
    telegramBotLink?: string | null;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Derives the effective support category from a profile, with null as fallback. */
function deriveSupportCategory(p: Profile | null): SupportCategory {
  if (!p) return null;
  if (p.support_category === 'sap' || p.support_category === 'general' || p.support_category === 'it_support') {
    return p.support_category as SupportCategory;
  }
  // Keyword fallback for legacy profiles
  const dept  = (p.department ?? '').toLowerCase();
  const name  = (p.name ?? '').toLowerCase();
  const email = (p.email ?? '').toLowerCase();
  if (dept.includes('sap') || dept.includes('erp') || name.includes('sap') || email.includes('sap')) return 'sap';
  if (dept.includes('facility') || dept.includes('facilities') || dept.includes('maintenance') ||
      dept.includes('workplace') || name.includes('facility') || email.includes('facility')) return 'general';
  return null; // unknown / not categorised yet
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [supportCategory, setSupportCategory] = useState<SupportCategory>(null);

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
      setSupportCategory(deriveSupportCategory(userData.profile ?? null));

      // Extract role from roles array (assuming single role for now)
      const userRole = userData.roles && userData.roles.length > 0
        ? userData.roles[0].name as AppRole
        : 'requester';

      setRole(userRole);
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('eec_last_active_time');
      setUser(null);
      setProfile(null);
      setRole(null);
      setSupportCategory(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await laravelClient.post('/login', { email, password });

      const { token, user: userData } = response.data;

      localStorage.setItem('auth_token', token);
      localStorage.setItem('eec_last_active_time', Date.now().toString());
      sessionStorage.removeItem('eec_session_timed_out');

      setUser(userData);
      setProfile(userData.profile);
      setSupportCategory(deriveSupportCategory(userData.profile ?? null));

      const userRole = userData.roles && userData.roles.length > 0
        ? userData.roles[0].name as AppRole
        : 'requester';

      setRole(userRole);

      return { error: null };
    } catch (error) {
      return {
        error: new Error(
          toAuthUserMessage(getApiErrorMessage(error, 'Failed to sign in')),
        ),
      };
    }
  };

  const signUp = async (email: string, password: string, name: string, telegram?: string, phone?: string) => {
    try {
      const payload: Record<string, string> = {
        name,
        email,
        password,
        password_confirmation: password,
      };
      if (telegram) {
        payload.telegram_username = telegram;
      }
      if (phone) {
        payload.phone = phone;
      }

      const response = await laravelClient.post('/register', payload);

      // Check if user is pending approval (no token returned)
      if (response.data.status === 'pending') {
        return {
          error: null,
          isPending: true,
          message: response.data.message,
          autoApproveAfterMinutes: response.data.auto_approve_after_minutes ?? null,
          supportEmail: response.data.support_email,
          telegramBotUsername: response.data.telegram_bot_username ?? null,
          telegramBotLink: response.data.telegram_bot_link ?? null,
        };
      }

      // Normal registration flow (if admin creates user with active status)
      const { token, user: userData } = response.data;

      localStorage.setItem('auth_token', token);

      setUser(userData);
      setProfile(userData.profile);
      setSupportCategory(deriveSupportCategory(userData.profile ?? null));

      const userRole = userData.roles && userData.roles.length > 0
        ? userData.roles[0].name as AppRole
        : 'requester';

      setRole(userRole);

      return { error: null, isPending: false };
    } catch (error) {
      return {
        error: new Error(
          toAuthUserMessage(getApiErrorMessage(error, 'Failed to sign up')),
        ),
        isPending: false,
      };
    }
  };

  const signOut = async () => {
    try {
      await laravelClient.post('/logout');
    } catch {
      // Ignore network errors on logout; clear local session regardless.
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('eec_last_active_time');
      sessionStorage.removeItem('eec_session_timed_out');
      setUser(null);
      setProfile(null);
      setRole(null);
      setSupportCategory(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, supportCategory, loading, signIn, signUp, signOut }}>
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
