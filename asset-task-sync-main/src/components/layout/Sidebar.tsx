import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Monitor,
  ClipboardList,
  Users,
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Calendar,
  Plus,
  FileText,
  ScrollText,
  MapPin,
  Briefcase,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, signOut } = useAuth();

  const adminLinks: { href: string; icon: typeof LayoutDashboard; label: string; badge?: number }[] = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/assets', icon: Monitor, label: 'Assets' },
    { href: '/tickets', icon: ClipboardList, label: 'Tickets' },
    { href: '/calendar', icon: Calendar, label: 'Calendar' },
    { href: '/schedules', icon: Wrench, label: 'Schedules' },
    { href: '/reports', icon: FileText, label: 'Reports' },
    { href: '/locations', icon: MapPin, label: 'Locations' },
    { href: '/departments', icon: Briefcase, label: 'Departments' },
    { href: '/faqs', icon: BookOpen, label: 'FAQ' },
    { href: '/users', icon: Users, label: 'Users' },
    { href: '/activity-logs', icon: ScrollText, label: 'Activity' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const superAdminLinks = adminLinks;

  const technicianLinks: { href: string; icon: typeof LayoutDashboard; label: string; badge?: number }[] = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/tickets', icon: ClipboardList, label: 'My Tickets' },
    { href: '/assets', icon: Monitor, label: 'Assets' },
    { href: '/calendar', icon: Calendar, label: 'Schedule' },
    { href: '/reports', icon: FileText, label: 'Reports' },
    { href: '/help', icon: HelpCircle, label: 'Help' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const requesterLinks: { href: string; icon: typeof LayoutDashboard; label: string; badge?: number }[] = [
    { href: '/requests', icon: Plus, label: 'New Request' },
    { href: '/tickets', icon: ClipboardList, label: 'My Requests' },
    { href: '/help', icon: HelpCircle, label: 'Help' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const links = role === 'super_admin'
    ? superAdminLinks
    : role === 'admin'
      ? adminLinks
      : role === 'technician'
        ? technicianLinks
        : requesterLinks;

  const handleLogout = async () => {
    onClose?.();
    await signOut();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out flex flex-col',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white overflow-hidden">
              <img src="/src/assets/eecc.png" alt="EEEC Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">EEC</h1>
              <p className="text-xs text-sidebar-foreground/60">IT Maintenance Scheduler</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white mx-auto overflow-hidden">
            <img src="/src/assets/eecc.png" alt="EEEC Logo" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={onClose}
              className={cn(
                'sidebar-link',
                isActive && 'active'
              )}
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{link.label}</span>
                  {link.badge && (
                    <Badge variant="secondary" className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                      {link.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <button
          className="sidebar-link w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </aside>
  );
};

export default Sidebar;
