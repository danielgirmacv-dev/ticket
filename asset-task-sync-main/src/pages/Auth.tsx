import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Wrench, Shield, Users, Check, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';
import laravelClient from '@/integrations/laravel/client';
import { eeccLogo } from '@/lib/branding';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

interface TurnstileConfig {
  enabled: boolean;
  site_key: string | null;
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupTelegram, setSignupTelegram] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [turnstileConfig, setTurnstileConfig] = useState<TurnstileConfig>({ enabled: false, site_key: null });
  const [loginTurnstileToken, setLoginTurnstileToken] = useState<string | null>(null);
  const [signupTurnstileToken, setSignupTurnstileToken] = useState<string | null>(null);
  const [loginTurnstileResetKey, setLoginTurnstileResetKey] = useState(0);
  const [signupTurnstileResetKey, setSignupTurnstileResetKey] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const turnstileSiteKey =
    turnstileConfig.site_key || import.meta.env.VITE_TURNSTILE_SITE_KEY || null;
  const turnstileEnabled = !!turnstileSiteKey && (turnstileConfig.enabled || !!import.meta.env.VITE_TURNSTILE_SITE_KEY);

  const resetLoginTurnstile = useCallback(() => {
    setLoginTurnstileToken(null);
    setLoginTurnstileResetKey((key) => key + 1);
  }, []);

  const resetSignupTurnstile = useCallback(() => {
    setSignupTurnstileToken(null);
    setSignupTurnstileResetKey((key) => key + 1);
  }, []);

  useEffect(() => {
    laravelClient
      .get('/turnstile/config')
      .then((response) => {
        setTurnstileConfig({
          enabled: Boolean(response.data.enabled),
          site_key: response.data.site_key ?? null,
        });
      })
      .catch(() => {
        const fallbackKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
        if (fallbackKey) {
          setTurnstileConfig({ enabled: true, site_key: fallbackKey });
        }
      });
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (authLoading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      type: 'circle' | 'cross';
      angle: number;
      spinSpeed: number;
      baseOpacity: number;
      pulseSpeed: number;
      pulseTime: number;
      update: (mouseX: number, mouseY: number) => void;
      draw: (context: CanvasRenderingContext2D) => void;
    }

    const particles: Particle[] = [];
    const particleCount = Math.min(150, Math.floor((width * height) / 9000));

    const createParticle = (initYAtTop = false): Particle => {
      const baseOpacity = Math.random() * 0.45 + 0.15;
      const maxDepth = height * 0.35;
      // Quadratic/exponential distribution to group particles heavily at the very top of the page
      const yVal = initYAtTop 
        ? 0 
        : Math.pow(Math.random(), 2.4) * maxDepth;
      
      return {
        x: Math.random() * width,
        y: yVal,
        size: Math.random() * 3.5 + 2.5, // Increased size for better visibility
        speedX: (Math.random() - 0.5) * 0.4 - 0.22, // Faster elegant drift to the left
        speedY: (Math.random() - 0.5) * 0.2, // Faster vertical waving
        baseOpacity,
        opacity: baseOpacity,
        type: Math.random() > 0.4 ? 'cross' : 'circle', // High ratio of crosses as in the image
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.025, // Faster rotation for the crosses
        pulseSpeed: Math.random() * 0.015 + 0.003,
        pulseTime: Math.random() * 100,
        update(mouseX: number, mouseY: number) {
          this.x += this.speedX;
          this.y += this.speedY;
          this.angle += this.spinSpeed;
          this.pulseTime += this.pulseSpeed;

          // Wrap horizontally
          if (this.x < -10) this.x = width + 10;
          if (this.x > width + 10) this.x = -10;

          // Respawn at the top if it drifts too low or high
          if (this.y > maxDepth || this.y < -10) {
            this.y = 0;
            this.x = Math.random() * width;
            this.speedX = (Math.random() - 0.5) * 0.4 - 0.22;
            this.speedY = Math.random() * 0.15;
          }

          // Calculate vertical gradient fade (density fades to 0 towards the bottom threshold)
          const depthFade = Math.max(0, 1 - (this.y / maxDepth));
          this.opacity = (this.baseOpacity + Math.sin(this.pulseTime) * 0.06) * depthFade;

          // Gentle mouse push
          const dx = mouseX - this.x;
          const dy = mouseY - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const force = (100 - dist) / 100;
            this.x -= (dx / dist) * force * 0.3;
            this.y -= (dy / dist) * force * 0.3;
          }
        },
        draw(context: CanvasRenderingContext2D) {
          if (this.opacity <= 0.01) return;
          context.save();
          context.globalAlpha = this.opacity;
          
          // Teal-green/mint color from your reference image
          const colorString = 'rgba(45, 212, 191, 0.75)'; 
          
          if (this.type === 'circle') {
            context.fillStyle = colorString;
            context.beginPath();
            context.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
            context.fill();
          } else {
            // Draw a tiny rotating "+" cross shape
            context.translate(this.x, this.y);
            context.rotate(this.angle);
            context.strokeStyle = colorString;
            context.lineWidth = 1.3; // Increased stroke width for larger crosses
            context.beginPath();
            context.moveTo(-this.size, 0);
            context.lineTo(this.size, 0);
            context.moveTo(0, -this.size);
            context.lineTo(0, this.size);
            context.stroke();
          }
          context.restore();
        }
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    let mouseX = -1000;
    let mouseY = -1000;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update(mouseX, mouseY);
        p.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [authLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (turnstileEnabled && !loginTurnstileToken) {
      toast.error('Please complete the security verification');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword, loginTurnstileToken ?? undefined);
    setIsLoading(false);

    if (error) {
      resetLoginTurnstile();
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please confirm your email before logging in');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
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

    if (turnstileEnabled && !signupTurnstileToken) {
      toast.error('Please complete the security verification');
      return;
    }

    setIsLoading(true);
    const result = await signUp(
      signupEmail,
      signupPassword,
      signupName,
      signupTelegram,
      signupTurnstileToken ?? undefined,
    );
    setIsLoading(false);

    if (result.error) {
      resetSignupTurnstile();
      if (result.error.message.includes('User already registered')) {
        toast.error('An account with this email already exists');
      } else {
        toast.error(result.error.message);
      }
    } else if (result.isPending) {
      setSuccessMessage(result.message || 'Registration successful! Awaiting admin approval.');
      setShowSuccessDialog(true);
      
      // Clear form
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setSignupTelegram('');
      resetSignupTurnstile();
    } else {
      setSuccessMessage('Account created successfully!');
      setShowSuccessDialog(true);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#012229] via-[#043e49] to-[#075362]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gradient-to-tr from-[#012229] via-[#043e49] to-[#075362]">
      {/* Dynamic Interactive Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Subtle Ambient Radial Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-white/10 mb-3 p-2 shadow-xl shadow-teal-950/20">
            <img src={eeccLogo} alt="EEEC Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
            EEC
          </h1>
          <p className="text-teal-200/60 text-sm mt-1">IT Maintenance Scheduler</p>
        </div>

        <Card className="border border-white/20 shadow-2xl bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              resetLoginTurnstile();
              resetSignupTurnstile();
            }}
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
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-slate-700 font-medium text-xs tracking-wider uppercase">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@company.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 transition-all duration-200"
                    />
                  </div>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {turnstileEnabled && turnstileSiteKey && (
                    <TurnstileWidget
                      siteKey={turnstileSiteKey}
                      resetKey={loginTurnstileResetKey}
                      onVerify={setLoginTurnstileToken}
                      onExpire={resetLoginTurnstile}
                      onError={resetLoginTurnstile}
                    />
                  )}
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold h-11 rounded-xl shadow-lg shadow-teal-600/10 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
                    disabled={isLoading || (turnstileEnabled && !loginTurnstileToken)}
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
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-700 font-medium text-xs tracking-wider uppercase">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@company.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-slate-50/50 border-slate-200 focus-visible:border-teal-500/50 focus-visible:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 transition-all duration-200"
                    />
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
                    <p className="text-[10px] text-slate-400">
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
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
                  {turnstileEnabled && turnstileSiteKey && (
                    <TurnstileWidget
                      siteKey={turnstileSiteKey}
                      resetKey={signupTurnstileResetKey}
                      onVerify={setSignupTurnstileToken}
                      onExpire={resetSignupTurnstile}
                      onError={resetSignupTurnstile}
                    />
                  )}
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold h-11 rounded-xl shadow-lg shadow-teal-600/10 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
                    disabled={isLoading || (turnstileEnabled && !signupTurnstileToken)}
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
            <Shield className="h-5 w-5 mx-auto mb-2 text-teal-400 animate-pulse" />
            <p className="text-[10px] font-semibold tracking-wider text-teal-200/80 uppercase">Secure Access</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/10">
            <Wrench className="h-5 w-5 mx-auto mb-2 text-emerald-400 animate-pulse" />
            <p className="text-[10px] font-semibold tracking-wider text-teal-200/80 uppercase">Track Tickets</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/10">
            <Users className="h-5 w-5 mx-auto mb-2 text-cyan-400 animate-pulse" />
            <p className="text-[10px] font-semibold tracking-wider text-teal-200/80 uppercase">Team Collab</p>
          </div>
        </div>
      </div>

      {/* Watermark Logo (Bottom-Right) - Logo Icon Only in Crisp White */}
      <div className="absolute bottom-8 right-8 z-0 pointer-events-none select-none flex items-center">
        <svg className="w-12 h-12 text-white opacity-85" viewBox="0 0 100 100" fill="currentColor">
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
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600">
              <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
              <svg className="w-12 h-12 text-emerald-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-checkmark-draw" />
              </svg>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
              Registration Successful!
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm max-w-sm">
              {successMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={() => {
                setShowSuccessDialog(false);
              }}
              className="w-full max-w-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
