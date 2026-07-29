import { ReactNode, useState } from 'react';
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

  return (
    <div className="min-h-screen bg-background flex max-w-full overflow-x-hidden">
      {/* Sidebar backdrop overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className={cn(
        'flex-1 transition-all duration-300 ease-in-out min-w-0 max-w-full overflow-x-hidden',
        'lg:ml-64'
      )}>
        <Header 
          title={title} 
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="p-3 sm:p-6 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* AI Chatbot Widget */}
      <ChatBot />
    </div>
  );
};

export default DashboardLayout;
