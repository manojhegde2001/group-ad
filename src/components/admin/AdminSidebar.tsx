'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, BarChart3, Tags, Users, Building2,
  ShieldAlert, CalendarDays, MapPin, Settings,
  LogOut, ChevronRight, ExternalLink, ShieldCheck, Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  userAvatar?: string;
}

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/businesses', label: 'Businesses', icon: Building2 },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/venues', label: 'Venues', icon: MapPin },
  { href: '/reports', label: 'Reports', icon: ShieldAlert, danger: true },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar({ userName, userEmail, userAvatar }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // On admin subdomain, internal paths are without /admin prefix
  // (middleware rewrites / → /admin, /users → /admin/users, etc.)
  // The pathname here is what Next.js sees internally, so still /admin/*
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/admin' || pathname === '/';
    return pathname.startsWith(`/admin${href}`) || pathname.startsWith(href);
  };

  const getHref = (href: string) => {
    if (typeof window === 'undefined') return href;
    const isAdminSubdomain = window.location.hostname.startsWith('admin.');
    if (isAdminSubdomain) return href; // subdomain: /users, /analytics, etc.
    return `/admin${href === '/' ? '' : href}`; // main domain: /admin/users
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Group Ad</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, danger }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={getHref(href)}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? danger
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400'
                  : danger
                    ? 'text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  active
                    ? danger ? 'text-red-600 dark:text-red-400' : 'text-violet-600 dark:text-violet-400'
                    : 'opacity-60 group-hover:opacity-100'
                )}
              />
              <span className="flex-1 truncate">{label}</span>
              {active && (
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  danger ? 'bg-red-500' : 'bg-violet-500'
                )} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-slate-100 dark:border-slate-800" />

      {/* Footer links */}
      <div className="p-3 space-y-0.5">
        <Link
          href="https://www.groupad.net"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
        >
          <ExternalLink className="w-4 h-4 shrink-0 opacity-60" />
          <span className="flex-1">View Live Site</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: 'https://admin.groupad.net/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0 opacity-60" />
          <span className="flex-1 text-left">Sign Out</span>
        </button>
      </div>

      {/* User avatar / identity */}
      <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <Avatar
            src={userAvatar}
            name={userName}
            className="w-8 h-8 rounded-full shrink-0 ring-2 ring-slate-100 dark:ring-slate-800"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate leading-tight">{userName}</p>
            <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-900 rounded-lg shadow-md border border-slate-200 dark:border-slate-800 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-xl transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar — desktop static */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
