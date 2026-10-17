import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Monitor,
  ClipboardList,
  Users,
  Settings,
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
import { eeccLogo } from '@/lib/branding';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: number;
  section?: string;
}

const Sidebar = ({
  isOpen = false,
  onClose,
  collapsed: externalCollapsed,
  onToggleCollapse,
}: SidebarProps) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isControlled = externalCollapsed !== undefined;
  const collapsed = isControlled ? externalCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const location = useLocation();
  const navigate = useNavigate();
  const { role, profile, signOut } = useAuth();

  const adminLinks: NavItem[] = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'Main' },
    { href: '/tickets', icon: ClipboardList, label: 'Tickets', section: 'Main' },
    { href: '/assets', icon: Monitor, label: 'Assets', section: 'Main' },
    { href: '/calendar', icon: Calendar, label: 'Calendar', section: 'Main' },
    { href: '/schedules', icon: Wrench, label: 'IT Schedule', section: 'Main' },
    { href: '/reports', icon: FileText, label: 'Reports', section: 'Management' },
    { href: '/locations', icon: MapPin, label: 'Locations', section: 'Management' },
    { href: '/departments', icon: Briefcase, label: 'Departments', section: 'Management' },
    { href: '/faqs', icon: BookOpen, label: 'FAQ', section: 'Management' },
    { href: '/users', icon: Users, label: 'Users', section: 'Administration' },
    { href: '/activity-logs', icon: ScrollText, label: 'Activity Logs', section: 'Administration' },
    { href: '/settings', icon: Settings, label: 'Settings', section: 'System' },
  ];

  const technicianLinks: NavItem[] = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'Main' },
    { href: '/tickets', icon: ClipboardList, label: 'My Tickets', section: 'Main' },
    { href: '/assets', icon: Monitor, label: 'Assets', section: 'Main' },
    { href: '/calendar', icon: Calendar, label: 'Schedule', section: 'Main' },
    { href: '/reports', icon: FileText, label: 'Reports', section: 'Management' },
    { href: '/help', icon: HelpCircle, label: 'Help', section: 'Support' },
    { href: '/settings', icon: Settings, label: 'Settings', section: 'System' },
  ];

  const requesterLinks: NavItem[] = [
    { href: '/requests', icon: Plus, label: 'New Request', section: 'Requests' },
    { href: '/tickets', icon: ClipboardList, label: 'My Requests', section: 'Requests' },
    { href: '/help', icon: HelpCircle, label: 'Help Center', section: 'Support' },
    { href: '/settings', icon: Settings, label: 'Settings', section: 'System' },
  ];

  const links = role === 'super_admin' || role === 'admin'
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

  const getRoleLabel = (r: string | null) => {
    const map: Record<string, string> = {
      super_admin: 'Super Admin',
      admin:       'Manager',
      technician:  'Technician',
      requester:   'Employee',
    };
    return map[r ?? ''] ?? 'User';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-[#0f5766] text-slate-100 transition-all duration-300 ease-in-out flex flex-col border-r border-[#0a3f4d] shadow-xl',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'w-[72px]' : 'w-[256px]'
        )}
      >
        {/* Brand Header - 72px Height with 12-16px horizontal padding */}
        <div className="flex h-[72px] items-center justify-between px-3.5 border-b border-white/10 shrink-0 bg-[#093d4a]">
          {!collapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-md shadow-black/25 shrink-0">
                <img src={eeccLogo} alt="EEC Logo" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-[17px] font-bold text-white tracking-tight leading-none">EEC</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/25 text-blue-300 border border-blue-400/30">
                    ITSM
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-1">IT Ticket System</p>
              </div>
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 mx-auto shadow-md shadow-black/25">
              <img src={eeccLogo} alt="EEC Logo" className="h-full w-full object-contain" />
            </div>
          )}
        </div>

        {/* Navigation - Independently scrollable, 48px item height, 4-6px spacing, 15px font */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
          {links.map((link, index) => {
            const isActive = location.pathname === link.href;
            const showSectionHeader = !collapsed && link.section && (index === 0 || links[index - 1].section !== link.section);

            const navItem = (
              <Link
                to={link.href}
                onClick={onClose}
                className={cn(
                  'flex items-center h-12 rounded-xl text-[15px] font-medium transition-all duration-150 group relative',
                  collapsed ? 'w-12 mx-auto justify-center px-0' : 'px-3.5 gap-3.5',
                  isActive
                    ? 'bg-[#11adc4] text-white shadow-md shadow-[#11adc4]/30 font-semibold'
                    : 'text-[#b2e8f0] hover:text-white hover:bg-white/[0.10]'
                )}
              >
                <link.icon className={cn(
                  'h-[21px] w-[21px] shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-[#b2e8f0] group-hover:text-white'
                )} />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate tracking-tight">{link.label}</span>
                    {link.badge !== undefined && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30">
                        {link.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );

            return (
              <div key={link.href} className="space-y-1">
                {showSectionHeader && (
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 px-3.5 pt-3 pb-1">
                    {link.section}
                  </p>
                )}
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="bg-[#093d4a] text-white border-white/10 text-xs font-medium px-3 py-1.5 shadow-xl">
                      {link.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  navItem
                )}
              </div>
            );
          })}
        </nav>

        {/* User Info & Logout Footer - Anchored at bottom */}
        <div className="border-t border-white/10 p-3 shrink-0 bg-[#093d4a]/80 mt-auto space-y-2">
          {!collapsed && profile && (
            <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="h-9 w-9 rounded-full bg-[#11adc4] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                {getInitials(profile?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate leading-tight">{profile?.name || 'User'}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{getRoleLabel(role)}</p>
              </div>
            </div>
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center justify-center h-12 w-12 mx-auto rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-500/15 transition-all duration-150"
                  onClick={handleLogout}
                  aria-label="Log out"
                >
                  <LogOut className="h-5 w-5 text-slate-400 hover:text-rose-400 transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="bg-[#093d4a] text-rose-300 border-white/10 text-xs font-medium px-3 py-1.5 shadow-xl">
                Log out
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              className="flex items-center gap-3 w-full h-11 px-3.5 rounded-xl text-[14px] font-medium text-slate-300 hover:text-rose-400 hover:bg-rose-500/15 transition-all duration-150 group"
              onClick={handleLogout}
            >
              <LogOut className="h-[20px] w-[20px] shrink-0 text-slate-400 group-hover:text-rose-400 transition-colors" />
              <span>Log out</span>
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={handleToggle}
          className="hidden lg:flex absolute -right-3.5 top-[82px] h-7 w-7 rounded-full border border-[#0a3f4d] bg-[#0f5766] text-[#b2e8f0] hover:text-white hover:bg-[#11adc4] items-center justify-center shadow-lg transition-colors z-50 cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 stroke-[2.5]" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
