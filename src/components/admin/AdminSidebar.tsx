'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, BarChart3, Tags, Users, Building2,
  ShieldAlert, CalendarDays, MapPin, Settings,
  LogOut, ExternalLink, Menu, X,
  ChevronDown, Zap, Activity,
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
  badge?: string;
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
    <div className="flex flex-col h-full bg-[#0f0f14] text-white">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white/10">
              <Image
                src="/auth/logo-small.svg"
                alt="Group Ad"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
                priority
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0f0f14]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">Group Ad</p>
            <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-[0.15em]">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
        <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
        <span className="text-[11px] font-semibold text-emerald-400">All systems operational</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {NAV_GROUPS.map(({ title, items }) => {
          const isGroupCollapsed = collapsed[title];
          return (
            <div key={title}>
              <button
                onClick={() => toggleGroup(title)}
                className="w-full flex items-center justify-between px-2 mb-1.5 group"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 group-hover:text-white/50 transition-colors">
                  {title}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 text-white/20 transition-all group-hover:text-white/40',
                    isGroupCollapsed && 'rotate-180'
                  )}
                />
              </button>

              {!isGroupCollapsed && (
                <div className="space-y-0.5">
                  {items.map(({ href, label, icon: Icon, danger, badge }) => {
                    const active = isActive(href);
                    return (
                      <Link
                        key={href}
                        href={getHref(href)}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                          active
                            ? danger
                              ? 'bg-red-500/15 text-red-300'
                              : 'bg-violet-500/20 text-violet-200'
                            : danger
                              ? 'text-white/40 hover:bg-red-500/10 hover:text-red-300'
                              : 'text-white/40 hover:bg-white/[0.06] hover:text-white/90'
                        )}
                      >
                        {active && (
                          <span
                            className={cn(
                              'absolute left-0 inset-y-1.5 w-0.5 rounded-r-full',
                              danger ? 'bg-red-400' : 'bg-violet-400'
                            )}
                          />
                        )}
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            active
                              ? danger ? 'text-red-400' : 'text-violet-400'
                              : 'opacity-50 group-hover:opacity-80'
                          )}
                        />
                        <span className="flex-1 truncate">{label}</span>
                        {badge && (
                          <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                            {badge}
                          </span>
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
      <div className="mx-4 border-t border-white/[0.06]" />

      {/* Footer links */}
      <div className="px-3 py-3 space-y-0.5">
        <Link
          href="https://www.groupad.net"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/30 hover:bg-white/[0.05] hover:text-white/70 transition-all"
        >
          <ExternalLink className="w-4 h-4 shrink-0 opacity-60" />
          <span className="flex-1">View Live Site</span>
          <Zap className="w-3 h-3 opacity-40" />
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: 'https://admin.groupad.net/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/30 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0 opacity-60" />
          <span className="flex-1 text-left">Sign Out</span>
        </button>
      </div>

      {/* User identity */}
      <div className="mx-3 mb-3 px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar
              src={userAvatar}
              name={userName}
              className="w-8 h-8 rounded-full ring-2 ring-violet-500/40"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">{userName}</p>
            <p className="text-[11px] text-white/30 truncate">{userEmail}</p>
          </div>
          <div className="shrink-0 px-1.5 py-0.5 rounded-md bg-violet-500/20 border border-violet-500/30">
            <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wide">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-[#0f0f14] rounded-xl shadow-xl border border-white/10 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
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
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 shadow-2xl">
        <SidebarContent />
      </aside>
    </>
  );
}
