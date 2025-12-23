'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  DollarSign,
  MessageCircle,
  Calendar,
  Settings,
  LogOut,
  User,
  AlertTriangle,
  Settings as SettingsIcon,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/lib/store';

const navItems = [
  { href: '/dashboard/client', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/client/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/dashboard/client/payments', icon: DollarSign, label: 'Payments' },
  { href: '/dashboard/client/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/dashboard/client/milestones', icon: Calendar, label: 'Milestones' },
  { href: '/dashboard/client/disputes', icon: AlertTriangle, label: 'Disputes' },
  { href: '/dashboard/client/ai-assistant', icon: SettingsIcon, label: 'AI Assistant' },
  { href: '/dashboard/client/reporting', icon: BarChart3, label: 'Reporting' },
  { href: '/dashboard/client/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-64 bg-background border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Delivault</h1>
        <p className="text-sm text-muted-foreground">Client Dashboard</p>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard/client'
                           ? pathname === item.href
                           : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link href={item.href} className="block">
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2 border-t border-border space-y-2">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-sm font-medium text-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}