'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search, ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';

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
              <span
                className={
                  i === crumbs.length - 1
                    ? 'text-sm font-semibold text-slate-900 dark:text-white'
                    : 'text-sm text-slate-400'
                }
              >
                {crumb.label}
              </span>
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
        {/* Search - Desktop */}
        <div
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 ${
            searchFocused
              ? 'bg-slate-100 dark:bg-slate-800 border-primary/40 w-52'
              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 w-40'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none w-full"
          />
        </div>

        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
          <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

        {/* Avatar Area */}
        <div className="flex items-center gap-2.5 ml-1">
          <Avatar
            src={userAvatar}
            name={userName}
            className="w-8 h-8 rounded-full ring-2 ring-slate-100 dark:ring-slate-800"
          />
          <div className="hidden md:flex flex-col items-start leading-none">
             <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">
               {userName}
             </span>
             <span className="text-[10px] text-slate-400">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
