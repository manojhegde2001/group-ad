'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Bell, Search, ChevronRight, Settings, LogOut, User, Clock } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { Popover, Button, Text } from 'rizzui';
import { signOut } from 'next-auth/react';

interface AdminTopBarProps {
  userName: string;
  userEmail: string;
  userAvatar?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/analytics': 'Analytics',
  '/admin/users': 'Users',
  '/admin/businesses': 'Businesses',
  '/admin/categories': 'Categories',
  '/admin/events': 'Events',
  '/admin/venues': 'Venues',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
};

function getBreadcrumbs(pathname: string) {
  const label = ROUTE_LABELS[pathname] ?? 'Admin';
  if (pathname === '/admin') return [{ label: 'Dashboard', href: '/admin' }];
  return [
    { label: 'Admin', href: '/admin' },
    { label, href: pathname },
  ];
}

export default function AdminTopBar({ userName, userAvatar }: AdminTopBarProps) {
  const pathname = usePathname();
  const [searchFocused, setSearchFocused] = useState(false);
  const crumbs = getBreadcrumbs(pathname);
  const currentPage = crumbs[crumbs.length - 1].label;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shrink-0 transition-colors duration-300">
      {/* Brand & Breadcrumb Area */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Logo - Always visible */}
        <Link href="/admin" className="flex items-center gap-2 shrink-0">
           <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-105">
              <Image src="/auth/logo-small.svg" alt="Logo" width={28} height={28} className="w-7 h-7 object-contain" />
           </div>
           <span className="hidden sm:inline-block font-black text-slate-900 dark:text-white tracking-tight text-sm">Console</span>
        </Link>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2 hidden lg:block" />

        {/* Breadcrumb - Desktop */}
        <div className="flex items-center gap-1.5 min-w-0 lg:flex hidden">
          {crumbs.map((crumb, i) => (
            <div key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
              <Link
                href={crumb.href.startsWith('/admin') ? crumb.href : `/admin${crumb.href}`}
                className={cn(
                  'text-sm transition-colors hover:text-primary',
                  i === crumbs.length - 1
                    ? 'font-semibold text-slate-900 dark:text-white'
                    : 'text-slate-400'
                )}
              >
                {crumb.label}
              </Link>
            </div>
          ))}
        </div>
        
        {/* Mobile Page Title */}
        <div className="lg:hidden pl-8">
           <span className="text-sm font-bold text-slate-900 dark:text-white">{currentPage}</span>
        </div>
      </div>

      {/* Right Actions Area */}
      <div className="flex items-center gap-3">
        {/* Search - Desktop with Mockup Functionality */}
        <Popover placement="bottom-start" showArrow={false}>
          <Popover.Trigger>
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-text ${
                searchFocused
                  ? 'bg-white dark:bg-slate-800 border-primary shadow-lg shadow-primary/5 w-64'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 w-48'
              }`}
            >
              <Search className={cn("w-3.5 h-3.5 shrink-0 transition-colors", searchFocused ? "text-primary" : "text-slate-400")} />
              <input
                type="text"
                placeholder="Search console… (⌘K)"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none w-full"
              />
            </div>
          </Popover.Trigger>
          <Popover.Content className="p-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
             <div className="space-y-3">
                <div>
                   <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                      Recent Searches
                   </Text>
                   <div className="space-y-1">
                      {['New users this week', 'Audit logs', 'Business verification'].map(q => (
                        <button key={q} className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                           <Clock className="w-3 h-3 opacity-50" /> {q}
                        </button>
                      ))}
                   </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                   <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                      Quick Transitions
                   </Text>
                   <div className="grid grid-cols-2 gap-1.5">
                      <Link href="/admin/users" className="px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-center hover:bg-primary/10 hover:text-primary transition-all">Users</Link>
                      <Link href="/admin/reports" className="px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all">Reports</Link>
                   </div>
                </div>
             </div>
          </Popover.Content>
        </Popover>

        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
          <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

        {/* Avatar Area - Functional Dropdown */}
        <Popover placement="bottom-end">
          <Popover.Trigger>
            <button className="flex items-center gap-2.5 ml-1 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group/avatar">
              <Avatar
                src={userAvatar}
                name={userName}
                className="w-8 h-8 rounded-full ring-2 ring-slate-100 dark:ring-slate-800 group-hover/avatar:ring-primary/30"
              />
              <div className="hidden md:flex flex-col items-start leading-none text-left">
                 <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">
                   {userName}
                 </span>
                 <span className="text-[10px] text-slate-400 font-medium">Administrator</span>
              </div>
            </button>
          </Popover.Trigger>
          <Popover.Content className="p-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
             <div className="px-3 py-2 mb-1">
                <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                   Admin Account
                </Text>
             </div>
             <div className="space-y-0.5">
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <Link
                  href="/admin/profile"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Link>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                <button
                  onClick={() => signOut({ callbackUrl: 'https://admin.groupad.net/login' })}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
             </div>
          </Popover.Content>
        </Popover>
      </div>
    </header>
  );
}
