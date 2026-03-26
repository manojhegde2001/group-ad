'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Bell, Search, ChevronRight, Settings, LogOut, User, Clock, ShieldAlert, Activity, Building2, CalendarDays } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ActionIcon } from '@/components/ui/action-icon';
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

import { formatDistanceToNow } from 'date-fns';

const Logo = dynamic(() => import('../ui/logo'), {
  ssr: false,
});

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  const crumbs = getBreadcrumbs(pathname);
  const currentPage = crumbs[crumbs.length - 1].label;

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setNotifCount(data.count || 0);
    } catch (err) {
      console.error('Failed to fetch admin notifications');
    } finally {
      setLoadingNotifs(false);
    }
  };

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Search logic
  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (val.length < 2) {
       setSearchResults([]);
       return;
    }
    setSearching(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
         const res = await fetch(`/api/admin/search?q=${encodeURIComponent(val)}`);
         const data = await res.json();
         setSearchResults(data.results || []);
      } catch (err) {
         console.error('Search failed');
      } finally {
         setSearching(false);
      }
    }, 400);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shrink-0 transition-colors duration-300">
      {/* Brand & Breadcrumb Area */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Logo - Always visible */}
        <Link href="/admin" className="flex items-center gap-2 shrink-0 transition-all hover:scale-105">
           <div className="w-10 h-10 flex items-center justify-center">
             <Logo iconOnly className="w-8 h-8 object-contain" />
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
        {/* Search - Desktop with Real Functionality */}
        <Popover placement="bottom-start" showArrow={false}>
          <Popover.Trigger>
            <div>
              <Input
                type="text"
                placeholder="Search console… (⌘K)"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                onChange={(e) => handleSearch(e.target.value)}
                variant="flat"
                rounded="pill"
                size="md"
                prefix={<Search className={cn("w-4 h-4 transition-colors", searchFocused ? "text-primary" : "text-slate-400")} />}
                clearable={!!searchQuery}
                onClear={() => { setSearchQuery(''); setSearchResults([]); }}
                className={cn("hidden sm:block transition-all duration-300", searchFocused ? "w-64 lg:w-80" : "w-48 lg:w-64")}
                inputClassName="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary shadow-sm h-10"
              />
            </div>
          </Popover.Trigger>
          <Popover.Content className="p-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
             <div className="space-y-3">
                {searching ? (
                  <div className="flex items-center justify-center py-4">
                    <Activity className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div>
                    <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                      Quick Access
                    </Text>
                    <div className="space-y-1">
                      {['New users this week', 'Audit logs', 'Business verification'].map(q => (
                        <button key={q} className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                           <Clock className="w-3 h-3 opacity-50" /> {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 font-bold">No matches found for "{searchQuery}"</div>
                ) : (
                  <div>
                    <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                      Search Results
                    </Text>
                    <div className="space-y-0.5">
                      {searchResults.map((res: any) => (
                        <Link 
                           key={res.id} 
                           href={res.href || `/admin/${res.type === 'user' ? 'users' : res.type === 'business' ? 'businesses' : 'events'}`}
                           className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 group/link transition-all"
                        >
                           <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                             {res.type === 'user' ? <User className="w-4 h-4 text-primary" /> : res.type === 'business' ? <Building2 className="w-4 h-4 text-violet-500" /> : <CalendarDays className="w-4 h-4 text-emerald-500" />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{res.title}</p>
                              <p className="text-[10px] text-slate-400 font-medium truncate">{res.subtitle}</p>
                           </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          </Popover.Content>
        </Popover>

        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Notifications */}
        <Popover placement="bottom-end">
          <Popover.Trigger>
            <div className="relative">
              <ActionIcon variant="text" onClick={fetchNotifications} className="w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                <Bell className="w-[22px] h-[22px] stroke-[2px]" />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[17px] h-4.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full px-1 ring-2 ring-white dark:ring-slate-900 leading-none shadow-sm pointer-events-none">
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </ActionIcon>
            </div>
          </Popover.Trigger>
          <Popover.Content className="z-[100] p-0 w-[320px] sm:w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">Live Alert Center</h3>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full">
                {notifCount} Active
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {loadingNotifs ? (
                <div className="flex items-center justify-center py-10">
                   <Activity className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Bell className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No pending actions</p>
                </div>
              ) : (
                notifications.map((n: any) => (
                  <Link 
                    key={n.id} 
                    href={n.href}
                    className={cn(
                      "block px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group/item",
                      n.unread && "bg-primary/[0.02]"
                    )}
                  >
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
                          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">
                             {formatDistanceToNow(new Date(n.time), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
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
