'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

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
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 h-14 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/[0.06] shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 lg:flex hidden">
        {crumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3 text-white/20" />}
            <span
              className={
                i === crumbs.length - 1
                  ? 'text-sm font-semibold text-white/80'
                  : 'text-sm text-white/30'
              }
            >
              {crumb.label}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile page title */}
      <div className="flex-1 lg:hidden pl-12">
        <span className="text-sm font-bold text-white">{currentPage}</span>
      </div>

      {/* Search */}
      <div
        className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 ${
          searchFocused
            ? 'bg-white/[0.07] border-violet-500/40 w-52'
            : 'bg-white/[0.03] border-white/[0.06] w-40'
        }`}
      >
        <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
        <input
          type="text"
          placeholder="Search…"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="bg-transparent text-sm text-white placeholder-white/25 outline-none w-full"
        />
        {!searchFocused && (
          <kbd className="text-[10px] text-white/20 font-mono border border-white/10 rounded px-1">⌘K</kbd>
        )}
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-xl hover:bg-white/[0.06] transition-colors group">
        <Bell className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
      </button>

      {/* Avatar */}
      <div className="flex items-center gap-2.5">
        <Avatar
          src={userAvatar}
          name={userName}
          className="w-7 h-7 rounded-full ring-2 ring-violet-500/30"
        />
        <span className="hidden sm:block text-sm font-medium text-white/60 max-w-[110px] truncate">
          {userName}
        </span>
      </div>
    </header>
  );
}
