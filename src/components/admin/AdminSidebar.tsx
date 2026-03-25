'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, LayoutDashboard, Tags, Users, Building2, 
  Plus, ShieldAlert, CalendarDays 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  userName: string;
}

const MENU_ITEMS = [
  { href: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3 },
  { href: '/admin/events', label: 'Events Dashboard', icon: LayoutDashboard },
  { href: '/admin/categories', label: 'Manage Categories', icon: Tags },
  { href: '/admin/users', label: 'Manage Users', icon: Users },
  { href: '/admin/businesses', label: 'Manage Businesses', icon: Building2 },
  { href: '/admin/events/create', label: 'Create Event', icon: Plus },
  { href: '/admin/reports', label: 'Moderation Reports', icon: ShieldAlert, danger: true },
];

export default function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isAdminSubdomain, setIsAdminSubdomain] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdminSubdomain(window.location.hostname.startsWith('admin.'));
    }
  }, []);

  const getHref = (href: string) => {
    // If it's the external link to public events, don't touch it
    if (href === '/events') return href;
    
    // If we are on the admin subdomain, paths shouldn't have the /admin prefix in the URL
    if (isAdminSubdomain) {
      return href.startsWith('/admin') ? href.replace('/admin', '') || '/' : href;
    }
    
    // If on main domain, ensure /admin prefix exists
    return href.startsWith('/admin') ? href : `/admin${href}`;
  };

  return (
    <aside className="w-60 shrink-0 bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 flex flex-col">
      <div className="px-5 py-4 border-b border-secondary-100 dark:border-secondary-800">
        <span className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">Admin Panel</span>
        <p className="text-sm font-semibold text-secondary-800 dark:text-white mt-0.5 truncate">{userName}</p>
      </div>
      
      <nav className="flex-1 p-3 space-y-1">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const href = getHref(item.href);
          // For active state, we check if the internal path matches
          // (if on subdomain, pathname is /users, but it maps to /admin/users)
          const isActive = isAdminSubdomain 
            ? pathname === (item.href.replace('/admin', '') || '/') 
            : pathname === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={href} 
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? item.danger 
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30"
                    : "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30 shadow-sm"
                  : item.danger
                    ? "text-secondary-700 dark:text-secondary-300 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-700 dark:hover:text-red-400 border border-transparent"
                    : "text-secondary-700 dark:text-secondary-300 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-700 dark:hover:text-primary-400 border border-transparent"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "" : "opacity-70 group-hover:opacity-100")} />
              {item.label}
            </Link>
          );
        })}
        
        <div className="pt-4 mt-4 border-t border-secondary-100 dark:border-secondary-800">
          <Link 
            href="/events" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
          >
            <CalendarDays className="w-4 h-4 opacity-70" /> 
            View Public Events
          </Link>
        </div>
      </nav>

      <div className="p-3">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 text-xs text-secondary-400 hover:text-secondary-600 transition-colors">
          ← Back to App
        </Link>
      </div>
    </aside>
  );
}
