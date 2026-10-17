import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatBot from '@/components/ChatBot';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eec_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('eec_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden w-full">
      {/* Sidebar backdrop overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />
      
      <div className={cn(
        'flex-1 transition-all duration-300 ease-in-out min-w-0 flex flex-col',
        sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[256px]'
      )}>
        <Header 
          title={title} 
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="p-4 sm:p-5 lg:p-6 max-w-full flex-1 w-full space-y-5">
          {children}
        </main>
      </div>

      {/* AI Chatbot Widget */}
      <ChatBot />
    </div>
  );
};

export default DashboardLayout;
