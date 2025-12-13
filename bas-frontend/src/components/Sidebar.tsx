'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
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
  User
} from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    clearAuth();
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'Children', icon: Users, href: '/dashboard/children' },
    { label: 'Alerts', icon: Bell, href: '/dashboard/alerts' },
    { label: 'Scan Content', icon: Scan, href: '/dashboard/scan' },
    { label: 'Scan History', icon: History, href: '/dashboard/scan-history' },
    { label: 'Activity', icon: Activity, href: '/dashboard/activity' },
    { label: 'Incidents', icon: FileWarning, href: '/dashboard/incidents' },
  ];

  return (
    <div className="w-64 bg-white border-r border-neutral-200 h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-8 h-8" />
          <span className="text-2xl font-bold">Hubble</span>
        </div>
        <div className="text-sm text-neutral-600">
          {user?.firstName} {user?.lastName}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-200">
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
