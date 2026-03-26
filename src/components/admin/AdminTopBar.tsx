'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Bell, Search, ChevronRight, Settings, LogOut, User, Clock, ShieldAlert } from 'lucide-react';
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

const Logo = dynamic(() => import('../ui/logo'), {
  ssr: false,
});

const NOTIFICATIONS = [
  { id: 1, title: 'New Business Request', message: 'Nexus Tech is waiting for verification', time: '2 mins ago', type: 'system', unread: true },
  { id: 2, title: 'Security Alert', message: 'New admin login from Mumbai, India', time: '45 mins ago', type: 'security', unread: true },
  { id: 3, title: 'Report Filed', message: 'User @john_doe reported a post for spam', time: '3 hours ago', type: 'activity', unread: false },
  { id: 4, title: 'System Update', message: 'V2.4.0 successfully deployed to production', time: '5 hours ago', type: 'system', unread: false },
];

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
        <Link href="/admin" className="flex items-center gap-2 shrink-0 transition-all hover:scale-105">
           <Logo iconOnly className="w-9 h-9" />
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
        <Popover placement="bottom-end">
          <Popover.Trigger>
            <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
              <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary border-2 border-white dark:border-slate-900 shadow-sm" />
            </button>
          </Popover.Trigger>
          <Popover.Content className="z-[100] p-0 w-[320px] sm:w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">Notifications</h3>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full">2 New</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {NOTIFICATIONS.map((n) => (
                <div key={n.id} className={cn(
                  "px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group/item",
                  n.unread && "bg-primary/[0.02] dark:bg-primary/[0.01]"
                )}>
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border",
                      n.type === 'system' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-500 border-blue-100 dark:border-blue-800" :
                      n.type === 'security' ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-100 dark:border-red-800" :
                      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 border-emerald-100 dark:border-emerald-800"
                    )}>
                      {n.type === 'system' ? <Settings className="w-5 h-5" /> : n.type === 'security' ? <ShieldAlert className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{n.title}</p>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
              <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All Notifications</button>
            </div>
          </Popover.Content>
        </Popover>

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
