'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  Home,
  Compass,
  Calendar,
  MessageSquare,
  Settings,
  Users,
  ShieldCheck,
  Plus,
  Library
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCreatePost } from '@/hooks/use-feed';
import { useUnreadMessages } from '@/hooks/use-unread-messages';

const Logo = dynamic(() => import('../ui/logo'), {
  ssr: false,
});

export function Sidebar() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const { open: openCreatePost } = useCreatePost();
  const { totalUnread } = useUnreadMessages();

  if (!isAuthenticated) return null;

  const isBusiness = (user as any)?.userType === 'BUSINESS';
  const isAdmin = (user as any)?.userType === 'ADMIN';

  const navLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Boards', href: '/boards', icon: Library },
    { label: 'Events', href: '/events', icon: Calendar },
    { label: 'Messages', href: '/messages', icon: MessageSquare },
  ];

  if (isAdmin) {
    navLinks.push({ label: 'Admin', href: '/admin', icon: ShieldCheck });
  }

  const SidebarLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    const showBadge = href === '/messages' && totalUnread > 0;
    return (
      <Link
        href={href}
        title={label}
        className={cn(
          "flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 group relative",
          isActive
            ? "bg-secondary-900 text-white dark:bg-white dark:text-secondary-900 shadow-md"
            : "text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-white"
        )}
      >
        <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
        {/* Unread badge */}
        {showBadge && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-0.5 ring-2 ring-white dark:ring-secondary-900 leading-none pointer-events-none">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
        {/* Tooltip */}
        <span className="absolute left-16 px-2 py-1 bg-secondary-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          {label}
        </span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 w-20 h-screen bg-white dark:bg-secondary-900 border-r border-secondary-100 dark:border-secondary-800 flex flex-col items-center py-4 z-[60] hidden md:flex">
      {/* Logo Icon */}
      <Link href="/" className="mb-6 p-2 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-full transition-colors">
        <div className="w-10 h-10 overflow-hidden flex items-center justify-center">
            <Logo className="w-8 h-8 object-contain" iconOnly />
        </div>
      </Link>

      <nav className="flex-1 flex flex-col items-center gap-2 overflow-y-auto scrollbar-none pb-2">
        {navLinks.map((link) => (
          <SidebarLink key={link.href} {...link} />
        ))}

        <div className="w-8 h-[1px] bg-secondary-100 dark:bg-secondary-800 my-1" />
        
        {user?.userType !== 'INDIVIDUAL' && (
          <button
            onClick={() => openCreatePost()}
            title="Create Post"
            className="flex items-center justify-center w-12 h-12 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 transition-all shadow-lg hover:shadow-primary-500/30 group relative"
          >
            <Plus className="w-7 h-7 stroke-[3px]" />
            <span className="absolute left-16 px-2 py-1 bg-secondary-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              Create
            </span>
          </button>
        )}
      </nav>

      <div className="mt-auto">
        <SidebarLink href="/settings" icon={Settings} label="Settings" />
      </div>
    </aside>
  );
}
