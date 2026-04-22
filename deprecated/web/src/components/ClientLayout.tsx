'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/store/sidebar-store';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();
  
  // Hydrate auth state on mount
  useAuthHydration();
  
  // Show sidebar only on dashboard pages
  const showSidebar = pathname?.startsWith('/dashboard');

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 transition-all duration-200 motion-reduce:transition-none">
        {/* Top bar with hamburger menu */}
        <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 px-4 py-3 lg:hidden">
          <button
            onClick={toggle}
            className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors duration-150 active:scale-95"
            aria-label="Toggle sidebar"
            aria-expanded={isOpen}
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
