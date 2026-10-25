import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_LAST_ACTIVE_KEY = 'eec_last_active_time';
const STORAGE_TIMEOUT_MINUTES_KEY = 'session_timeout_minutes';
const DEFAULT_TIMEOUT_MINUTES = 60; // 60 minutes for a stable working session
const WARNING_WINDOW_SECONDS = 60; // Show countdown 60 seconds before logout

export function SessionTimeoutHandler() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(WARNING_WINDOW_SECONDS);
  const lastThrottleRef = useRef<number>(0);
  const isLoggingOutRef = useRef<boolean>(false);

  // Retrieve configured timeout duration in milliseconds
  const getTimeoutConfigMs = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_TIMEOUT_MINUTES_KEY);
    if (saved === 'disabled') {
      return null;
    }
    const mins = saved ? parseInt(saved, 10) : DEFAULT_TIMEOUT_MINUTES;
    const safeMins = isNaN(mins) || mins <= 0 ? DEFAULT_TIMEOUT_MINUTES : mins;
    return safeMins * 60 * 1000;
  }, []);

  // Update activity timestamp in localStorage (synced across tabs)
  const recordActivity = useCallback(() => {
    const now = Date.now();
    // Throttle writing to localStorage to at most once every 3 seconds
    if (now - lastThrottleRef.current > 3000) {
      lastThrottleRef.current = now;
      try {
        localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, now.toString());
      } catch {
        // Safe fallback
      }
    }
  }, []);

  // Perform logout due to idle timeout
  const handleTimeoutLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setIsWarningOpen(false);

    try {
      localStorage.removeItem(STORAGE_LAST_ACTIVE_KEY);
      sessionStorage.setItem('eec_session_timed_out', 'true');
      await signOut();
    } catch {
      // Ignore signOut network errors
    } finally {
      // Clean navigation to /auth without polluting the URL with query parameters
      navigate('/auth', { replace: true });
      isLoggingOutRef.current = false;
    }
  }, [signOut, navigate]);

  // Keep session alive when user confirms
  const handleStayLoggedIn = useCallback(() => {
    const now = Date.now();
    lastThrottleRef.current = now;
    localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, now.toString());
    setIsWarningOpen(false);
    setRemainingSeconds(WARNING_WINDOW_SECONDS);
    toast.success('Session Extended', {
      description: 'Your session has been refreshed.',
      duration: 3000,
    });
  }, []);

  // Refresh activity timestamp whenever an authenticated user session is established
  useEffect(() => {
    if (user) {
      const now = Date.now();
      lastThrottleRef.current = now;
      localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, now.toString());
      sessionStorage.removeItem('eec_session_timed_out');
    }
  }, [user?.id]);

  // Track user activity events
  useEffect(() => {
    if (!user || location.pathname === '/auth') {
      setIsWarningOpen(false);
      return;
    }

    // Set initial activity time if not present
    if (!localStorage.getItem(STORAGE_LAST_ACTIVE_KEY)) {
      localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, Date.now().toString());
    }

    const onUserInteraction = () => {
      recordActivity();
      // If warning modal is open, user activity auto-dismisses it
      if (isWarningOpen) {
        setIsWarningOpen(false);
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'input', 'wheel'];
    events.forEach((evt) => {
      window.addEventListener(evt, onUserInteraction, { passive: true });
    });

    // Also track mouse movements with lightweight throttle
    const onMouseMove = () => {
      recordActivity();
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, onUserInteraction);
      });
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [user, location.pathname, isWarningOpen, recordActivity]);

  // Listen to cross-tab updates via storage event
  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_LAST_ACTIVE_KEY) {
        // Another tab had activity, close warning if open
        if (isWarningOpen) {
          setIsWarningOpen(false);
        }
      }
    };

    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, [isWarningOpen]);

  // Periodic heartbeat timer to check idle time
  useEffect(() => {
    if (!user || location.pathname === '/auth') {
      return;
    }

    const checkIdle = () => {
      const timeoutMs = getTimeoutConfigMs();
      if (!timeoutMs) return; // Disabled

      const storedTimeStr = localStorage.getItem(STORAGE_LAST_ACTIVE_KEY);
      if (!storedTimeStr) {
        // Fresh start without stored timestamp — initialize now
        localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, Date.now().toString());
        return;
      }

      const lastActive = parseInt(storedTimeStr, 10);
      if (isNaN(lastActive) || lastActive <= 0) {
        localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, Date.now().toString());
        return;
      }

      const elapsed = Date.now() - lastActive;
      const warningThresholdMs = timeoutMs - WARNING_WINDOW_SECONDS * 1000;

      if (elapsed >= timeoutMs) {
        // Timed out completely!
        handleTimeoutLogout();
      } else if (elapsed >= warningThresholdMs) {
        // Inside warning window (last 60 seconds)
        const secondsLeft = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
        setRemainingSeconds(secondsLeft);
        if (!isWarningOpen) {
          setIsWarningOpen(true);
        }
      } else {
        // Activity is fresh, ensure warning is closed
        if (isWarningOpen) {
          setIsWarningOpen(false);
        }
      }
    };

    // Check immediately and then every 1 second
    checkIdle();
    const interval = setInterval(checkIdle, 1000);

    // Also check on tab focus or visibility change (e.g. waking laptop from sleep)
    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkIdle();
      }
    };

    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, [user, location.pathname, isWarningOpen, getTimeoutConfigMs, handleTimeoutLogout]);

  if (!user || location.pathname === '/auth') {
    return null;
  }

  return (
    <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
      <DialogContent className="sm:max-w-md border-amber-500/30 shadow-2xl backdrop-blur-xl bg-background/95">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-inner animate-pulse">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center text-xl font-bold tracking-tight">
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            You have been inactive for a while. For your security, this session will automatically end in:
          </DialogDescription>
        </DialogHeader>

        {/* Big countdown badge */}
        <div className="py-4 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-2xl font-black tracking-widest shadow-xs">
            <Clock className="h-6 w-6 animate-spin text-amber-500" style={{ animationDuration: '4s' }} />
            <span>00:{remainingSeconds.toString().padStart(2, '0')}</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Click anywhere or press any key to keep working.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleTimeoutLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out Now
          </Button>
          <Button
            type="button"
            className="w-full sm:flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold shadow-md shadow-teal-500/20"
            onClick={handleStayLoggedIn}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
