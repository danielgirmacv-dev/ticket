import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Wrench, Shield, Users, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  eeccLogo,
  brandPrimary,
  brandPrimaryDark,
  brandPrimaryLight,
  brandButtonClass,
  productName,
  productTagline,
  supportMailto,
} from '@/lib/branding';
import { ProfessionalEmailInput } from '@/components/ui/professional-email-input';
import { validateEmail, normalizeEmail } from '@/lib/email-validation';
import {
  normalizeTelegram,
  validateOptionalPhone,
  validateOptionalTelegram,
} from '@/lib/auth-validation';
import { AuthBackground } from '@/components/auth/AuthBackground';

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

type SuccessDialogVariant = 'pending' | 'active';

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDialogVariant, setSuccessDialogVariant] = useState<SuccessDialogVariant>('pending');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupTelegram, setSignupTelegram] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const resetSignupForm = () => {
    setSignupName('');
    setSignupEmail('');
    setSignupPhone('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setSignupTelegram('');
  };

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'inactivity') {
      toast.warning('Session Expired', {
        description: 'You were automatically logged out due to inactivity for your security.',
        duration: 6000,
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = normalizeEmail(loginEmail);
    const emailValidation = validateEmail(cleanEmail);
    if (!emailValidation.isValid) {
      toast.error(emailValidation.error || 'Please enter a valid email address');
      return;
    }

    try {
      passwordSchema.parse(loginPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(cleanEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = normalizeEmail(signupEmail);
    const emailValidation = validateEmail(cleanEmail);
    if (!emailValidation.isValid) {
      toast.error(emailValidation.error || 'Please enter a valid email address');
      return;
    }

    try {
      nameSchema.parse(signupName);
      passwordSchema.parse(signupPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const phoneError = validateOptionalPhone(signupPhone);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }

    const telegramError = validateOptionalTelegram(signupTelegram);
    if (telegramError) {
      toast.error(telegramError);
      return;
    }

    const cleanTelegram = normalizeTelegram(signupTelegram);
    const cleanPhone = signupPhone.trim();

    setIsLoading(true);
    const result = await signUp(
      cleanEmail,
      signupPassword,
      signupName.trim(),
      cleanTelegram || undefined,
      cleanPhone || undefined,
    );
    setIsLoading(false);

    if (result.error) {
      toast.error(result.error.message);
    } else if (result.isPending) {
      setSuccessDialogVariant('pending');
      setSuccessMessage(
        result.message ||
          'Your registration was submitted. An administrator will review your account shortly.',
      );
      setShowSuccessDialog(true);
      resetSignupForm();
    } else {
      setSuccessDialogVariant('active');
      setSuccessMessage('Your account is ready. You can sign in now.');
      setShowSuccessDialog(true);
      resetSignupForm();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#012229] via-[#043e49] to-[#075362]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandPrimaryLight }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <AuthBackground active={!authLoading} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-[#1AB1C7]/40 mb-3 p-2 shadow-xl backdrop-blur-md"
            style={{ backgroundColor: `${brandPrimary}18`, boxShadow: `0 12px 28px -8px ${brandPrimary}55` }}
          >
            <img src={eeccLogo} alt={`${productName} logo`} className="h-full w-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
            {productName}
          </h1>
          <p className="text-teal-200/60 text-sm mt-1">{productTagline}</p>
        </div>

        <Card className="border border-white/20 shadow-2xl bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full p-2"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100/80 p-1 border border-slate-200/40 rounded-xl">
              <TabsTrigger 
                value="login"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-500 hover:text-slate-800 rounded-lg transition-all duration-200 shadow-sm"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-500 hover:text-slate-800 rounded-lg transition-all duration-200 shadow-sm"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader className="pt-0">
                  <CardTitle className="text-slate-900 font-bold text-xl">Welcome Back</CardTitle>
                  <CardDescription className="text-slate-500 text-sm">
                    Sign in to access your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProfessionalEmailInput
                    id="login-email"
                    label="Email"
                    placeholder="you@company.com"
                    value={loginEmail}
                    onChange={setLoginEmail}
                    required
                    disabled={isLoading}
                    labelClassName="text-slate-700"
                    inputClassName="bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
                  />
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-slate-700 font-medium text-xs tracking-wider uppercase">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 pr-10 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <a
                        href={supportMailto}
                        className="text-xs font-medium hover:underline"
                        style={{ color: brandPrimaryDark }}
                      >
                        Forgot password? Contact IT support
                      </a>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    type="submit" 
                    className={brandButtonClass}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardHeader className="pt-0">
                  <CardTitle className="text-slate-900 font-bold text-xl">Create Account</CardTitle>
                  <CardDescription className="text-slate-500 text-sm">
                    Register to submit maintenance requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-slate-700 font-medium text-xs tracking-wider uppercase">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Full Name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 transition-all duration-200"
                    />
                  </div>
                  <ProfessionalEmailInput
                    id="signup-email"
                    label="Email"
                    placeholder="you@company.com"
                    value={signupEmail}
                    onChange={setSignupEmail}
                    required
                    disabled={isLoading}
                    labelClassName="text-slate-700"
                    inputClassName="bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
                  />
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="text-slate-700 font-medium text-xs tracking-wider uppercase flex items-center gap-1">
                      Phone Number <span className="text-[10px] text-slate-400 font-normal lowercase">(Optional)</span>
                    </Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+251911223344"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      disabled={isLoading}
                      className="bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 transition-all duration-200"
                    />
                    <p className="text-xs text-slate-400">
                      Used for SMS notifications when available
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-telegram" className="text-slate-700 font-medium text-xs tracking-wider uppercase flex items-center gap-1">
                      Telegram Username <span className="text-[10px] text-slate-400 font-normal lowercase">(Optional)</span>
                    </Label>
                    <Input
                      id="signup-telegram"
                      type="text"
                      placeholder="@username or username"
                      value={signupTelegram}
                      onChange={(e) => setSignupTelegram(e.target.value)}
                      disabled={isLoading}
                      className="bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 transition-all duration-200"
                    />
                    <p className="text-xs text-slate-400">
                      Receive instant approval notifications
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-700 font-medium text-xs tracking-wider uppercase">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 pr-10 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Use at least 8 characters.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-slate-700 font-medium text-xs tracking-wider uppercase">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showSignupConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 pr-10 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                        aria-label={showSignupConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showSignupConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    type="submit" 
                    className={brandButtonClass}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/10">
            <Shield className="h-5 w-5 mx-auto mb-2" style={{ color: brandPrimaryLight }} />
            <p className="text-xs font-semibold tracking-wider text-teal-200/80 uppercase">Secure Access</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/10">
            <Wrench className="h-5 w-5 mx-auto mb-2" style={{ color: brandPrimary }} />
            <p className="text-xs font-semibold tracking-wider text-teal-200/80 uppercase">Track Tickets</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/10">
            <Users className="h-5 w-5 mx-auto mb-2" style={{ color: brandPrimaryLight }} />
            <p className="text-xs font-semibold tracking-wider text-teal-200/80 uppercase">Team Collab</p>
          </div>
        </div>
      </div>

      {/* Watermark Logo (Bottom-Right) - Logo Icon Only in Crisp White */}
      <div className="absolute bottom-8 right-8 z-0 pointer-events-none select-none flex items-center">
        <svg className="w-12 h-12 opacity-90" style={{ color: brandPrimaryLight }} viewBox="0 0 100 100" fill="currentColor">
          <rect x="42" y="0" width="16" height="96" rx="8" />
          <rect x="42" y="0" width="58" height="16" rx="8" />
          <rect x="42" y="32" width="58" height="16" rx="8" />
          <rect x="42" y="64" width="58" height="16" rx="8" />
          <rect x="0" y="16" width="58" height="16" rx="8" />
          <rect x="0" y="48" width="58" height="16" rx="8" />
          <rect x="0" y="80" width="58" height="16" rx="8" />
        </svg>
      </div>

      {/* Success Dialog Modal */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md text-center p-8 border border-slate-100 bg-white shadow-2xl rounded-2xl animate-scale-up text-slate-800">
          <DialogHeader className="flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full" style={{ backgroundColor: `${brandPrimary}18`, color: brandPrimary }}>
              <span className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: `${brandPrimary}33` }} />
              <svg className="w-12 h-12 relative z-10" style={{ color: brandPrimary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-checkmark-draw" />
              </svg>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
              {successDialogVariant === 'pending' ? 'Application submitted' : 'Account created'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm max-w-sm">
              {successMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={() => {
                setShowSuccessDialog(false);
                if (successDialogVariant === 'pending') {
                  setActiveTab('login');
                }
              }}
              className={`${brandButtonClass} max-w-xs py-6`}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
