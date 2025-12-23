'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import {
  LayoutDashboard,
  FolderOpen,
  DollarSign,
  Users,
  MessageCircle,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

interface NavItem {
  title: string;
  href: string;
  badge?: number;
}

interface NavGroup {
  title: string;
  icon: any;
  items: NavItem[];
}

// Define navigation groups for different user roles
const getNavGroups = (role: 'client' | 'freelancer' | 'admin' | 'arbitrator' | null): NavGroup[] => {
  if (!role) return []; // Return empty array if no role

  const navGroups: NavGroup[] = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      items: [
        {
          title: 'Home Dashboard',
          href: '/dashboard',
        },
      ],
    },
    {
      title: 'Projects',
      icon: FolderOpen,
      items: [
        {
          title: 'All Projects',
          href: '/dashboard/projects',
        },
        {
          title: 'Active Projects',
          href: '/dashboard/projects/active',
        },
        ...(role === 'client' ? [
          {
            title: 'Pending Agreements',
            href: '/dashboard/projects/pending',
          },
        ] : []),
        ...(role === 'freelancer' ? [
          {
            title: 'Invitations',
            href: '/dashboard/projects/invitations',
          },
        ] : []),
        {
          title: 'Completed Projects',
          href: '/dashboard/projects/completed',
        },
        {
          title: 'Archived Projects',
          href: '/dashboard/projects/archived',
        },
      ],
    },
    {
      title: 'Milestones',
      icon: FileText,
      items: [
        {
          title: 'Milestone Tracker',
          href: '/dashboard/milestones',
        },
        {
          title: 'Awaiting My Action',
          href: '/dashboard/milestones/awaiting-action',
        },
        ...(role === 'freelancer' ? [
          {
            title: 'Submit Milestone',
            href: '/dashboard/milestones/submit',
          },
        ] : []),
      ],
    },
  ];

  // Add role-specific sections
  if (role === 'client') {
    navGroups.push(
      {
        title: 'Escrow & Payments',
        icon: DollarSign,
        items: [
          {
            title: 'Escrow Overview',
            href: '/dashboard/escrow',
          },
          {
            title: 'Deposit Funds',
            href: '/dashboard/escrow/deposit',
          },
          {
            title: 'Transactions',
            href: '/dashboard/transactions',
          },
          {
            title: 'Billing & Invoices',
            href: '/dashboard/billing',
          },
          {
            title: 'Payment Methods',
            href: '/dashboard/payment-methods',
          },
        ],
      }
    );
  }

  if (role === 'freelancer') {
    navGroups.push(
      {
        title: 'Earnings & Payouts',
        icon: DollarSign,
        items: [
          {
            title: 'Earnings Overview',
            href: '/dashboard/earnings',
          },
          {
            title: 'Payouts',
            href: '/dashboard/payouts',
          },
          {
            title: 'Payment History',
            href: '/dashboard/earnings/history',
          },
          {
            title: 'Withdraw Funds',
            href: '/dashboard/payouts/withdraw',
          },
          {
            title: 'Payment Methods',
            href: '/dashboard/payment-methods',
          },
        ],
      }
    );
  }

  navGroups.push(
    {
      title: 'Disputes',
      icon: Users,
      items: [
        {
          title: 'My Disputes',
          href: '/dashboard/disputes',
        },
        {
          title: 'Open Cases',
          href: '/dashboard/disputes/open',
        },
        {
          title: 'Resolved Cases',
          href: '/dashboard/disputes/resolved',
        },
        {
          title: 'Submit Dispute',
          href: '/dashboard/disputes/submit',
        },
      ],
    },
    {
      title: 'Messaging',
      icon: MessageCircle,
      items: [
        {
          title: 'Project Messages',
          href: '/dashboard/messages',
        },
        {
          title: 'System Notifications',
          href: '/dashboard/notifications',
        },
      ],
    },
    {
      title: 'Profile',
      icon: Settings,
      items: [
        {
          title: 'My Profile',
          href: '/dashboard/profile',
        },
        {
          title: 'Ratings & Reviews',
          href: '/dashboard/ratings',
        },
        {
          title: 'KYC / ID Verification',
          href: '/dashboard/verification',
        },
      ],
    },
    {
      title: 'Settings',
      icon: Settings,
      items: [
        {
          title: 'Account Settings',
          href: '/dashboard/settings',
        },
        {
          title: 'Notifications',
          href: '/dashboard/settings/notifications',
        },
        {
          title: 'Language & Region',
          href: '/dashboard/settings/language',
        },
      ],
    }
  );

  // Add additional sections based on role
  if (role === 'client') {
    navGroups.push({
      title: 'Project Creation',
      icon: FileText,
      items: [
        {
          title: 'Create New Project',
          href: '/dashboard/projects/create',
        },
        {
          title: 'Milestone Templates',
          href: '/dashboard/templates/milestones',
        },
        {
          title: 'Contract Templates',
          href: '/dashboard/templates/contracts',
        },
      ],
    });
  }

  navGroups.push({
    title: 'Support',
    icon: Settings,
    items: [
      {
        title: 'Help Center',
        href: '/dashboard/help',
      },
      {
        title: 'Contact Support',
        href: '/dashboard/support/contact',
      },
      {
        title: 'FAQs',
        href: '/dashboard/support/faqs',
      },
    ],
  });

  return navGroups;
};

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuthStore();

  // Set default expanded groups based on user role
  const defaultExpandedGroups = {
    client: {
      Projects: true,
      Milestones: true,
      'Escrow & Payments': true,
      Disputes: false,
      Messaging: false,
      Profile: false,
      Settings: false,
      Support: false,
      'Project Creation': false,
    },
    freelancer: {
      Projects: true,
      Milestones: true,
      'Earnings & Payouts': true,
      Disputes: false,
      Messaging: false,
      Profile: false,
      Settings: false,
      Support: false,
    },
    admin: {
      Projects: true,
      Milestones: true,
      Disputes: true,
      Messaging: false,
      Profile: false,
      Settings: false,
      Support: false,
    },
    arbitrator: {
      Projects: false,
      Milestones: false,
      Disputes: true,
      Messaging: false,
      Profile: false,
      Settings: false,
      Support: false,
    }
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    ...(user?.role ? defaultExpandedGroups[user.role] : {}),
    // For unknown roles, use a default
    ...(!user?.role ? {
      Projects: true,
      Milestones: true,
      Disputes: false,
      Messaging: false,
      Profile: false,
      Settings: false,
      Support: false,
    } : {}),
  });

  const pathname = usePathname();
  const navGroups = getNavGroups(user?.role || null);

  const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-background"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border pt-16 md:pt-0 md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:flex md:flex-col transition-transform duration-300 ease-in-out h-screen overflow-y-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">D</span>
              </div>
              <span className="text-xl font-bold text-foreground">Delivault</span>
            </div>
          </div>

          {/* User info */}
          {user && (
            <div className="p-4 border-b border-border">
              <div className="text-sm font-medium text-foreground truncate">{user.firstName} {user.lastName}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  user.role === 'client' ? 'bg-primary/20 text-primary' :
                  user.role === 'freelancer' ? 'bg-success/20 text-success' :
                  user.role === 'admin' ? 'bg-warning/20 text-warning' :
                  'bg-gray-200 text-foreground'
                }`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navGroups.map((group) => {
                const Icon = group.icon;
                const isGroupOpen = openGroups[group.title] ?? false;

                return (
                  <div key={group.title} className="space-y-1">
                    <button
                      onClick={() => toggleGroup(group.title)}
                      className={`w-full flex items-center justify-between p-3 rounded-md text-sm font-medium transition-standard ${
                        group.items.some(item => {
                          if (group.title === 'Dashboard') {
                            return pathname === item.href;
                          }
                          return pathname === item.href ||
                                 pathname.startsWith(item.href + '/') ||
                                 pathname.startsWith(item.href + '?');
                        }) ||
                        (group.title === 'Dashboard' && pathname === '/dashboard')
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{group.title}</span>
                      </div>
                      {isGroupOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {/* Submenu items - only show if group is open */}
                    {isGroupOpen && (
                      <div className="ml-6 space-y-1">
                        {group.items.map((item) => {
                          const isActive = group.title === 'Dashboard'
                                         ? pathname === item.href
                                         : pathname === item.href ||
                                           pathname.startsWith(item.href + '/') ||
                                           pathname.startsWith(item.href + '?');

                          return (
                            <Link href={item.href} key={item.href} onClick={() => setIsMobileOpen(false)}>
                              <div
                                className={`flex items-center justify-between p-2 rounded-sm text-sm transition-standard ${
                                  isActive
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                }`}
                              >
                                <span>{item.title}</span>
                                {item.badge !== undefined && (
                                  <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Logout */}
            <div className="pt-4 border-t border-border mt-auto">
              <Link href="/auth/login">
                <div className="flex items-center gap-3 p-3 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-standard">
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </div>
              </Link>
            </div>

            {/* Theme Toggle */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}