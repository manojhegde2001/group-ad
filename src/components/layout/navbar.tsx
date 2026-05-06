'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { useMe } from '@/hooks/use-api/use-user';
import { useAuthModal } from '@/hooks/use-modal';
import { useCreatePostModal, useFeedFilter } from '@/hooks/use-feed';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  Settings,
  Bell,
  Check,
  CheckCheck,
  Loader2,
  X,
  Menu,
  Calendar,
  ShieldCheck,
  Library,
  Home,
  Compass,
  MessageSquare,
  PlusCircle,
  User,
  Layout,
  Sun,
  Moon,
  Zap
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { useUnreadNotifications } from '@/hooks/use-unread-notifications';
import { SearchBar } from './search-bar';
import { ActionIcon } from '../ui/action-icon';
import { cn } from '@/lib/utils';
import { Drawer, Popover } from 'rizzui';
import { MobileBottomNav } from './mobile-bottom-nav';

const Logo = dynamic(() => import('../ui/logo'), {
  ssr: false,
  loading: () => <div className="w-8 h-8 md:w-28 md:h-7 bg-secondary-200 dark:bg-secondary-700 rounded-full md:rounded animate-pulse" />,
});

function DrawerLink({ href, icon: Icon, label, onClick, active, className, badge }: { 
    href: string; 
    icon: any; 
    label: string; 
    onClick: () => void;
    active?: boolean;
    className?: string;
    badge?: number;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group relative",
                active 
                    ? "bg-secondary-900 text-white dark:bg-white dark:text-secondary-900 shadow-md font-bold" 
                    : "text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-white font-semibold",
                className
            )}
        >
            <div className="relative">
                <Icon className={cn("w-5 h-5", active ? "stroke-[2.5px]" : "stroke-[2px]")} />
                {badge && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-white dark:ring-secondary-900 leading-none">
                        {badge > 99 ? '99+' : badge}
                    </span>
                )}
            </div>
            <span className="text-base">{label}</span>
        </Link>
    );
}

export function Navbar() {
  const { user: authUser, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { data: meUser, isLoading: meLoading } = useMe();
  const user = meUser || authUser;
  const loading = authLoading || (isAuthenticated && meLoading && !meUser);

  const { openLogin, openSignup } = useAuthModal();
  const { setSearch } = useFeedFilter();
  const createPostModal = useCreatePostModal();
  const { totalUnread: unreadMessages } = useUnreadMessages();
  const { unreadCount: unreadNotifications } = useUnreadNotifications();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [queryStarted, setQueryStarted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !queryStarted) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth') === 'required') {
        openLogin();
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      setQueryStarted(true);
    }
  }, [openLogin, queryStarted]);

  useEffect(() => { setMounted(true); }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileDrawerOpen(false);
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 bg-white dark:bg-secondary-900 border-b border-transparent h-14 md:h-20" />
    );
  }

  // --- Guest View (Logged Out) ---
  if (!isAuthenticated) {
    return (
      <nav className="sticky top-0 z-50 bg-white dark:bg-secondary-900 border-b border-secondary-100 dark:border-secondary-800 hidden md:flex h-20 items-center">
        <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between px-4 md:px-8 gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center">
            <Logo className="w-28 md:w-32 h-8 md:h-10" />
          </Link>

          {/* Guest Links */}
          <div className="hidden lg:flex items-center gap-6 font-bold text-secondary-900 dark:text-white">
             <Link href="/explore" className="hover:text-primary-500 transition-colors">Explore</Link>
             <Link href="/about" className="hover:text-primary-500 transition-colors">About</Link>
          </div>

          {/* Search Bar (Static/Small for Guests) */}
          <div className="flex-1">
            <SearchBar className="w-full" />
          </div>

          <div className="flex items-center gap-3 shrink-0">
             {pathname !== '/auth' && (
               <>
                 <Button onClick={() => openLogin()} variant="text" color="secondary" className="font-bold text-secondary-900 dark:text-white px-4">Log in</Button>
                 <Button onClick={() => openSignup()} variant="solid" color="danger" className="font-bold px-4 py-2 bg-[#e60023] hover:bg-[#ad081b] rounded-full text-white">Sign up</Button>
               </>
             )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className={cn(
          "sticky top-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md transition-all duration-300",
          "hidden md:flex h-20 items-center",
          isAuthenticated ? "md:ml-0" : "" 
      )}>
        <div className="flex-1 flex items-center px-4 md:px-6 gap-2 md:gap-4 h-full">
          
          {/* Mobile Logo / Menu */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
              <Link href="/" className="p-2">
                  <Logo className="w-8 h-8" iconOnly />
              </Link>
          </div>

          <div className="flex-1 flex items-center">
              <SearchBar className="w-full" />
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1">
              <NotificationBell />
            </div>

            <ThemeSwitcher />

            {/* Profile Menu */}
            <div className="ml-1 md:ml-2">
              {loading || isLoggingOut ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              ) : (
                <Popover isOpen={dropdownOpen} setIsOpen={setDropdownOpen} placement="bottom-end">
                  <Popover.Trigger>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full hover:ring-4 ring-secondary-100 dark:ring-secondary-800 transition-all shrink-0">
                      <Avatar
                        src={(user?.avatar as string) ?? undefined}
                        name={(user?.name as string) || 'User'}
                        size="sm"
                        rounded="full"
                        className="w-10 h-10 object-cover shadow-sm"
                      />
                    </button>
                  </Popover.Trigger>
                  <Popover.Content className="z-[9999] p-2 w-[min(calc(100vw-2rem),280px)] bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-100 dark:border-secondary-800 overflow-hidden">
                    <div className="flex flex-col gap-1">
                      {/* Profile Header */}
                      <Link
                        href={`/profile/${(user as any).username || ''}`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors group"
                      >
                        <Avatar
                          src={(user?.avatar as string) || undefined}
                          name={user?.name || 'User'}
                          size="sm"
                          className="w-11 h-11 shadow-sm transition-transform group-hover:scale-105"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-secondary-900 dark:text-white leading-tight truncate">{user?.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mt-1">
                            {(user as any).userType === 'BUSINESS' ? 'Business' : 'Personal Account'}
                          </p>
                        </div>
                      </Link>

                      <div className="h-px bg-secondary-100 dark:bg-secondary-800 my-1 mx-2" />

                      {/* Menu Links */}
                      <div className="space-y-0.5">
                        {((user as any).userType === 'ADMIN' || (user as any).userType === 'BUSINESS') && (
                          <Link
                            href="/events/calendar"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800/50 font-bold text-xs text-secondary-700 dark:text-secondary-300 transition-colors"
                          >
                            <Calendar className="w-4 h-4" /> Events Calendar
                          </Link>
                        )}
                        <Link
                          href={`/profile/${(user as any).username || ''}`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800/50 font-bold text-xs text-secondary-700 dark:text-secondary-300 transition-colors"
                        >
                          <Library className="w-4 h-4" /> My Workspace
                        </Link>

                        {(user as any).userType === 'ADMIN' && (
                          <Link
                            href="https://admin.groupad.net/"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 font-bold text-xs text-primary-600 dark:text-primary-400 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" /> Admin Console
                          </Link>
                        )}

                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800/50 font-bold text-xs text-secondary-700 dark:text-secondary-300 transition-colors"
                        >
                          <Settings className="w-4 h-4" /> Account Settings
                        </Link>
                      </div>

                      <div className="h-px bg-secondary-100 dark:bg-secondary-800 my-1 mx-2" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 font-bold text-xs text-red-500 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Log out
                      </button>
                    </div>
                  </Popover.Content>
                </Popover>
              )}
            </div>

            {/* Mobile Menu Trigger - HIDDEN (Moved to Bottom Nav) */}
            {/* <button
              className="md:hidden p-3 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <Menu className="w-6 h-6 text-secondary-600 dark:text-secondary-300" />
            </button> */}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onMenuClick={() => setMobileDrawerOpen(true)} />

      <Drawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          placement="bottom"
          containerClassName="md:hidden w-full h-auto max-h-[90vh] bg-white dark:bg-secondary-900 shadow-2xl flex flex-col overflow-hidden rounded-t-[2.5rem]"
      >
        {/* Header - Centered Handle for Drawer */}
        <div className="flex flex-col items-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-secondary-200 dark:bg-secondary-800 rounded-full mb-4" />
            <div className="flex items-center justify-between w-full px-6">
                <div className="flex items-center gap-2">
                    <Logo className="w-8 h-8" iconOnly />
                    <span className="font-bold text-xl text-secondary-900 dark:text-white">More Options</span>
                </div>
                <ActionIcon
                    variant="flat"
                    rounded="full"
                    onClick={() => setMobileDrawerOpen(false)}
                >
                    <X className="w-5 h-5" />
                </ActionIcon>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none">
            {/* User Profile Section */}
            {isAuthenticated && user && (
                <div className="p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-2xl border border-secondary-100 dark:border-secondary-800">
                   <Link href={`/profile/${(user as any).username || ''}`} onClick={() => setMobileDrawerOpen(false)} className="flex items-center gap-4">
                        <Avatar src={(user?.avatar as string) || undefined} name={user?.name || 'User'} size="md" className="w-14 h-14 ring-2 ring-white dark:ring-secondary-700 shadow-sm" />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-secondary-900 dark:text-white truncate">{user?.name}</p>
                            <p className="text-sm text-secondary-500 truncate">{(user as any).userType === 'BUSINESS' ? 'Business Account' : 'Personal Account'}</p>
                        </div>
                   </Link>
                </div>
            )}

            {/* Main Navigation */}
            <nav className="space-y-1">~
                <p className="px-4 text-xs font-bold text-secondary-400 uppercase tracking-widest mb-2">Navigation</p>
                <DrawerLink href="/" icon={Home} label="Home" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/'} />
                <DrawerLink href="/explore" icon={Compass} label="Explore" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/explore'} />
                {((user as any)?.userType === 'ADMIN' || (user as any)?.userType === 'BUSINESS') && (
                  <>
                    <DrawerLink href="/events/calendar" icon={Calendar} label="Events" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/events/calendar'} />
                  </>
                )}
                <DrawerLink href="/boards" icon={Library} label="Boards" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/boards'} />
                <DrawerLink href="/notifications" icon={Bell} label="Notifications" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/notifications'} badge={unreadNotifications} />
                <DrawerLink href="/messages" icon={MessageSquare} label="Messages" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/messages'} badge={unreadMessages} />
            </nav>

            {/* Create Post Section - Only for authorized users */}
            {( (user as any)?.userType === 'ADMIN' || ((user as any)?.userType === 'BUSINESS' && (user as any)?.verificationStatus === 'VERIFIED') ) && (
                <div className="space-y-1">
                     <p className="px-4 text-xs font-bold text-secondary-400 uppercase tracking-widest mb-2">Actions</p>
                     <button
                        onClick={() => {
                            setMobileDrawerOpen(false);
                            createPostModal.open();
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all"
                     >
                        <PlusCircle className="w-6 h-6" /> Create Post
                     </button>
                </div>
            )}

            {/* Account Section */}
            <div className="space-y-1">
                <p className="px-4 text-xs font-bold text-secondary-400 uppercase tracking-widest mb-2">Account</p>
                <DrawerLink href={`/profile/${(user as any).username || ''}`} icon={User} label="My Profile" onClick={() => setMobileDrawerOpen(false)} active={pathname === `/profile/${(user as any).username}`} />
                {(user as any)?.userType === 'ADMIN' && (
                     <DrawerLink href="https://admin.groupad.net/" icon={ShieldCheck} label="Admin Panel" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/admin'} className="text-primary-600 dark:text-primary-400" />
                )}
                <DrawerLink href="/settings" icon={Settings} label="Settings" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/settings'} />
            </div>

            {/* Appearance Section */}
            <div className="space-y-1">
                <p className="px-4 text-xs font-bold text-secondary-400 uppercase tracking-widest mb-2">Appearance</p>
                <div className="px-4">
                    <button 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-100 dark:border-secondary-800 active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-secondary-900 flex items-center justify-center shadow-sm text-secondary-600 dark:text-secondary-400">
                                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </div>
                            <span className="font-bold text-secondary-900 dark:text-white">Theme</span>
                        </div>
                        <div className="px-3 py-1 bg-white dark:bg-secondary-900 rounded-lg text-xs font-black uppercase tracking-wider text-secondary-500 shadow-sm border border-secondary-100 dark:border-secondary-800">
                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </div>
                    </button>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-secondary-100 dark:border-secondary-800">
            <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
                <LogOut className="w-5 h-5" /> Log out
            </button>
        </div>
      </Drawer>
    </>
  );
}

