import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Menu, LogOut, User, Settings, CheckCheck, Trash2, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

const TYPE_DOT: Record<string, string> = {
  warning: 'bg-yellow-400',
  success: 'bg-emerald-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
};

const Header = ({ title, subtitle, onMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [open, setOpen] = useState(false);

  /* ── Real-time notifications (polls every 5 s) ── */
  const { data: allNotifications = [] } = useNotifications();
  const markAsRead      = useMarkAsRead();
  const markAllRead     = useMarkAllRead();
  const deleteNotif     = useDeleteNotification();

  // Only show unread ones in the bell dropdown
  const unread = allNotifications.filter(n => !n.is_read);
  const unreadCount = unread.length;

  /* ── Handlers ── */
  const handleNotificationClick = async (id: string, link?: string | null) => {
    // Immediately mark read (disappears from dropdown)
    markAsRead.mutate(id);
    setOpen(false);
    if (link) navigate(link);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success('All notifications marked as read'),
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotif.mutate(id);
  };

  /* ── UI helpers ── */
  const toggleDarkMode = () => {
    setIsDark(p => !p);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (r: string | null) => {
    const map: Record<string, string> = {
      super_admin: 'Super Admin',
      admin:       'Manager',
      technician:  'Technician',
      requester:   'Requester',
    };
    return map[r ?? ''] ?? 'User';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-6">
      {/* Left — title */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <Button variant="ghost" size="icon" className="lg:hidden flex-shrink-0" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-semibold text-foreground truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1 sm:gap-2">

        {/* Dark mode */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="text-muted-foreground hover:text-foreground"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* ── Notification Bell ── */}
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell className={cn('h-5 w-5', unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground')} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-in zoom-in-50 duration-200">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[min(calc(100vw-1rem),22rem)] p-0 overflow-hidden shadow-xl">
            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={handleMarkAllRead}
                  disabled={markAllRead.isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </Button>
              )}
            </div>

            {/* Notification list */}
            {unread.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                <BellOff className="h-8 w-8 opacity-30" />
                <p className="text-sm font-medium">You're all caught up!</p>
                <p className="text-xs">No new notifications</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[340px]">
                <div className="divide-y">
                  {unread.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className="group relative flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleNotificationClick(n.id, n.link)}
                    >
                      {/* Type indicator */}
                      <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', TYPE_DOT[n.type] ?? 'bg-blue-500')} />

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-0.5 pr-6">
                        <p className="text-sm font-medium leading-tight truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {format(new Date(n.created_at), 'MMM d · h:mm a')}
                        </p>
                      </div>

                      {/* Delete button — visible on hover */}
                      <button
                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDelete(e, n.id)}
                        title="Dismiss"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Footer */}
            <div className="border-t">
              <button
                className="w-full py-2.5 text-xs font-medium text-primary hover:bg-muted/50 transition-colors"
                onClick={() => { setOpen(false); navigate('/notifications'); }}
              >
                View all notifications →
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-2 sm:px-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(profile?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left max-w-[120px]">
                <p className="text-sm font-medium truncate">{profile?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(role)}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
