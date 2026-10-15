import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Wrench, Shield, Users, Eye, EyeOff, Lock, User as UserIcon, Phone, Send, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [pendingAutoApproveMinutes, setPendingAutoApproveMinutes] = useState<number | null>(null);

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
      setPendingAutoApproveMinutes(result.autoApproveAfterMinutes ?? null);
      setSuccessMessage(result.message || 'Your registration was submitted successfully.');
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

      <div className={cn("w-full relative z-10 transition-all duration-300 ease-in-out", activeTab === 'signup' ? 'max-w-xl sm:max-w-2xl' : 'max-w-md')}>
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

        <Card className="border border-white/20 shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full p-2 sm:p-3"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100/80 p-1 border border-slate-200/40 rounded-xl">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-500 hover:text-slate-800 rounded-lg transition-all duration-200 shadow-sm font-semibold"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-500 hover:text-slate-800 rounded-lg transition-all duration-200 shadow-sm font-semibold"
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
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10 pr-10 bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 transition-all duration-200"
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
                <CardFooter className="pt-2 flex flex-col gap-3">
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
                  <p className="text-xs text-center text-slate-500">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signup')}
                      className="font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors focus:outline-none"
                    >
                      Create an account
                    </button>
                  </p>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardHeader className="pt-0 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-slate-900 font-bold text-xl flex items-center gap-2">
                        Create Account

                      </CardTitle>
                      <CardDescription className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Register for IT ticketing & asset support. Fast automated or manager verification.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Compact Quick-Verification Note */}
                  <div className="rounded-xl border border-teal-500/20 bg-teal-50/70 dark:bg-teal-950/20 px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-teal-900 dark:text-teal-200">
                    <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                    <p className="leading-snug">
                      <span className="font-semibold">Quick Verification:</span> Once submitted, your account will be activated by a manager or approved automatically after a brief confirmation.
                    </p>
                  </div>

                  {/* Row 1: Full Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-name" className="text-slate-700 font-medium text-xs tracking-wider uppercase flex items-center justify-between">
                        <span>Full Name <span className="text-destructive font-bold">*</span></span>
                      </Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="e.g. Daniel Girma"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pl-10 bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <ProfessionalEmailInput
                      id="signup-email"
                      label="Work Email"
                      placeholder="you@company.com"
                      value={signupEmail}
                      onChange={setSignupEmail}
                      required
                      disabled={isLoading}
                      labelClassName="text-slate-700"
                      inputClassName="bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11"
                    />
                  </div>

                  {/* Row 2: Phone & Telegram (Optional Notifications) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-phone" className="text-slate-700 font-medium text-xs tracking-wider uppercase flex items-center gap-1">
                        <span>Phone Number</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="+251 911 223 344"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          disabled={isLoading}
                          className="pl-10 bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 transition-all duration-200"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">Used for SMS alerts when enabled</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-telegram" className="text-slate-700 font-medium text-xs tracking-wider uppercase flex items-center gap-1">
                        <span>Telegram</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="signup-telegram"
                          type="text"
                          placeholder="@username"
                          value={signupTelegram}
                          onChange={(e) => setSignupTelegram(e.target.value)}
                          disabled={isLoading}
                          className="pl-10 bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 transition-all duration-200"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">Receive instant ticket notifications</p>
                    </div>
                  </div>

                  {/* Row 3: Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-slate-700 font-medium text-xs tracking-wider uppercase flex items-center justify-between">
                        <span>Password <span className="text-destructive font-bold">*</span></span>
                        {signupPassword.length > 0 && (
                          <span className={cn(
                            "text-[10px] normal-case font-semibold transition-colors",
                            signupPassword.length >= 8 ? "text-emerald-600" : "text-amber-600"
                          )}>
                            {signupPassword.length >= 8 ? "Valid length" : `${8 - signupPassword.length} more chars`}
                          </span>
                        )}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pl-10 pr-10 bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        >
                          {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">Use at least 8 characters</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-confirm-password" className="text-slate-700 font-medium text-xs tracking-wider uppercase flex items-center justify-between">
                        <span>Confirm Password <span className="text-destructive font-bold">*</span></span>
                        {signupConfirmPassword.length > 0 && (
                          <span className={cn(
                            "text-[10px] normal-case font-semibold flex items-center gap-1 transition-colors",
                            signupPassword === signupConfirmPassword ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {signupPassword === signupConfirmPassword ? (
                              <>
                                <Check className="h-3 w-3 stroke-[2.5]" />
                                Passwords match
                              </>
                            ) : (
                              "Passwords do not match"
                            )}
                          </span>
                        )}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="signup-confirm-password"
                          type={showSignupConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className={cn(
                            "pl-10 pr-10 bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 transition-all duration-200",
                            signupConfirmPassword.length > 0 && signupPassword !== signupConfirmPassword && "border-rose-400 focus-visible:border-rose-400 focus-visible:ring-rose-400/20"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                          aria-label={showSignupConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        >
                          {showSignupConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">Re-enter your password</p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 flex flex-col gap-3">
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
                  <p className="text-xs text-center text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors focus:outline-none"
                    >
                      Sign In
                    </button>
                  </p>
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
            <DialogDescription asChild>
              <div className="text-slate-500 text-sm max-w-sm space-y-3 text-left">
                <p>{successMessage}</p>
                {successDialogVariant === 'pending' && (
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li>Check your email for confirmation when you can sign in.</li>
                    {pendingAutoApproveMinutes ? (
                      <li>
                        If no manager is available, your account is activated automatically within about{' '}
                        {pendingAutoApproveMinutes} minutes.
                      </li>
                    ) : null}
                    <li>
                      Need urgent access? Email{' '}
                      <a href={supportMailto} className="font-medium underline" style={{ color: brandPrimaryDark }}>
                        IT support
                      </a>
                      .
                    </li>
                  </ul>
                )}
              </div>
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
