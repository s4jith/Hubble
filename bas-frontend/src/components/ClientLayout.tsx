'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Show sidebar only on dashboard pages
  const showSidebar = pathname?.startsWith('/dashboard');

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}
