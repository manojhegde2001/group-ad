'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, BarChart3, Tags, Users, Building2,
  ShieldAlert, CalendarDays, MapPin, Settings,
  LogOut, ExternalLink, Menu, X, ChevronDown, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  userAvatar?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  danger?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Management',
    items: [
      { href: '/users', label: 'Users', icon: Users },
      { href: '/businesses', label: 'Businesses', icon: Building2 },
      { href: '/categories', label: 'Categories', icon: Tags },
      { href: '/events', label: 'Events', icon: CalendarDays },
      { href: '/venues', label: 'Venues', icon: MapPin },
    ],
  },
  {
    title: 'Safety',
    items: [
      { href: '/reports', label: 'Reports', icon: ShieldAlert, danger: true },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const Logo = dynamic(() => import('../ui/logo'), {
  ssr: false,
});

export default function AdminSidebar({ userName, userEmail, userAvatar }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/admin' || pathname === '/';
    return pathname.startsWith(`/admin${href}`) || pathname.startsWith(href);
  };

  const getHref = (href: string) => {
    if (typeof window === 'undefined') return href;
    const isAdminSubdomain = window.location.hostname.startsWith('admin.');
    if (isAdminSubdomain) return href;
    return `/admin${href === '/' ? '' : href}`;
  };

  const toggleGroup = (title: string) => {
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/40">
        <Link href={getHref('/')} className="flex items-center gap-3 transition-opacity hover:opacity-80 group/logo">
          <Logo className="w-32 h-9" />
          <div className="flex flex-col ml-0.5">
             <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] leading-none mt-1">Console</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map(({ title, items }) => {
          const isGroupCollapsed = collapsed[title];
          return (
            <div key={title}>
              <button
                onClick={() => toggleGroup(title)}
                className="w-full flex items-center justify-between px-2 mb-1.5 group"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                  {title}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 text-slate-300 dark:text-slate-600 transition-all group-hover:text-slate-400',
                    isGroupCollapsed && 'rotate-180'
                  )}
                />
              </button>

              {!isGroupCollapsed && (
                <div className="space-y-0.5">
                  {items.map(({ href, label, icon: Icon, danger }) => {
                    const active = isActive(href);
                    return (
                      <Link
                        key={href}
                        href={getHref(href)}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200',
                          active
                            ? danger
                              ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-bold shadow-sm'
                              : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-bold shadow-sm'
                            : danger
                              ? 'text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-300 font-medium'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium'
                        )}
                      >
                        <div className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          active
                            ? danger ? 'bg-red-100 dark:bg-red-900/40' : 'bg-primary/20 dark:bg-primary/30'
                            : 'bg-transparent'
                        )}>
                          <Icon
                            className={cn(
                              'w-4 h-4 shrink-0 transition-all',
                              active
                                ? danger ? 'text-red-600 dark:text-red-400 scale-110' : 'text-primary scale-110'
                                : 'opacity-60 group-hover:opacity-100 group-hover:scale-105'
                            )}
                          />
                        </div>
                        <span className="flex-1 truncate tracking-tight">{label}</span>
                        {active && (
                          <div className={cn('w-1.5 h-1.5 rounded-full shrink-0 shadow-sm', danger ? 'bg-red-500' : 'bg-primary')} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-slate-100 dark:border-slate-800" />

      {/* Footer links */}
      <div className="px-3 py-3 space-y-0.5">
        <Link
          href="https://www.groupad.net"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
        >
          <ExternalLink className="w-4 h-4 shrink-0 opacity-60" />
          <span className="flex-1">View Live Site</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: 'https://admin.groupad.net/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0 opacity-60" />
          <span className="flex-1 text-left">Sign Out</span>
        </button>
      </div>

      {/* User identity footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/20">
        <div className="flex items-center gap-3 px-1 py-1 rounded-xl group/user cursor-pointer">
          <div className="relative shrink-0">
             <Avatar
               src={userAvatar}
               name={userName}
               className="w-9 h-9 rounded-full ring-2 ring-slate-100 dark:ring-slate-800 group-hover/user:ring-primary/30 transition-all border border-transparent dark:border-slate-700"
             />
             <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-none mb-0.5">{userName}</p>
            <p className="text-[10px] font-medium text-slate-400 truncate tracking-tight">{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5 text-slate-700 dark:text-white" /> : <Menu className="w-5 h-5 text-slate-700 dark:text-white" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 shadow-2xl transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar — desktop static */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
