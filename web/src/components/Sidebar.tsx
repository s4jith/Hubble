'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useSidebarStore } from '@/store/sidebar-store';
import { 
  Shield, 
  Home, 
  Users, 
  Bell, 
  Scan, 
  History, 
  Activity, 
  FileWarning, 
  LogOut,
  X
} from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const { isOpen, close } = useSidebarStore();

  const handleLogout = async () => {
    clearAuth();
    router.push('/login');
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1025) {
      close();
    }
  };

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 1025) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'Children', icon: Users, href: '/dashboard/children' },
    { label: 'Alerts', icon: Bell, href: '/dashboard/alerts' },
    { label: 'Scan Content', icon: Scan, href: '/dashboard/scan' },
    { label: 'Scan History', icon: History, href: '/dashboard/scan-history' },
    { label: 'Activity', icon: Activity, href: '/dashboard/activity' },
    { label: 'Incidents', icon: FileWarning, href: '/dashboard/incidents' },
  ];

  // Determine the most specific matching nav item so only one is active
  const matching = navItems.filter((item) => {
    return pathname === item.href || pathname?.startsWith(item.href + '/');
  });

  const activeHref = matching.sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200 motion-reduce:transition-none"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-neutral-200 
          flex flex-col transform transition-transform duration-200 ease-out
          motion-reduce:transition-none
          lg:translate-x-0 lg:z-30
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-xl sm:text-2xl font-bold">Hubble</span>
          </div>
          <button
            onClick={close}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors duration-150"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 sm:px-6 py-3 border-b border-neutral-200 shrink-0">
          <div className="text-sm text-neutral-600 truncate">
            {user?.firstName} {user?.lastName}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === activeHref;

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={
                  `w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-left transition-all duration-150 ease-out motion-reduce:transition-none ` +
                  (isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 active:scale-[0.98]')
                }
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 sm:p-4 border-t border-neutral-200 shrink-0">
          <Button 
            variant="ghost" 
            className="w-full justify-start transition-all duration-150 hover:bg-neutral-100 active:scale-[0.98]" 
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3 shrink-0" />
            <span className="truncate">Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
