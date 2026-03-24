'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useMe } from '@/hooks/use-api/use-user';
import { useAuthModal } from '@/hooks/use-modal';
import { useCreatePost } from '@/hooks/use-feed';
import { useFeedFilter } from '@/hooks/use-feed';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  Settings,
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
  Bell,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { useUnreadNotifications } from '@/hooks/use-unread-notifications';
import { SearchBar } from './search-bar';
import { ActionIcon } from '../ui/action-icon';
import { cn } from '@/lib/utils';

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
  const { searchQuery, setSearch } = useFeedFilter();
  const { open: openCreatePost } = useCreatePost();
  const { totalUnread: unreadMessages } = useUnreadMessages();
  const { unreadCount: unreadNotifications } = useUnreadNotifications();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [mobileDrawerOpen]);

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
      <nav className="sticky top-0 z-50 bg-white dark:bg-secondary-900 border-b border-transparent h-16 md:h-20" />
    );
  }

  // --- Guest View (Logged Out) ---
  if (!isAuthenticated) {
    return (
      <nav className="sticky top-0 z-50 bg-white dark:bg-secondary-900 border-b border-secondary-100 dark:border-secondary-800 h-16 md:h-20 flex items-center">
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
          <div className="flex-1 hidden md:block">
            <SearchBar className="w-full" />
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3 shrink-0">
             <Button onClick={() => openLogin()} variant="text" color="secondary" className="font-bold text-secondary-900 dark:text-white px-4">Log in</Button>
             <Button onClick={() => openSignup()} variant="solid" color="danger" className="font-bold px-4 py-2 bg-[#e60023] hover:bg-[#ad081b] rounded-full text-white">Sign up</Button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className={cn(
          "sticky top-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md transition-all duration-300",
          "h-16 md:h-20 flex items-center",
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

            {/* Profile Dropdown Toggle */}
            <div className="relative ml-1 md:ml-2" ref={dropdownRef}>
              {loading || isLoggingOut ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              ) : (
                  <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center justify-center w-10 h-10 rounded-full hover:ring-4 ring-secondary-100 dark:ring-secondary-800 transition-all"
                  >
                      <Avatar
                          src={(user?.avatar as string) ?? undefined}
                          name={(user?.name as string) || 'User'}
                          size="sm"
                          rounded="full"
                          className="w-10 h-10 object-cover"
                      />
                  </button>
              )}

              {/* Desktop Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-secondary-900 sm:bg-white sm:dark:bg-secondary-900 sm:backdrop-blur-md rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700 overflow-hidden z-[200] p-2 hidden md:block">
                  <div className="px-3 py-3 rounded-xl mb-1 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors cursor-pointer text-secondary-900 dark:text-white">
                      <Link href={`/profile/${(user as any).username || ''}`} onClick={() => setDropdownOpen(false)}>
                          <div className="flex items-center gap-3">
                              <Avatar src={(user?.avatar as string) || undefined} name={user?.name || 'User'} size="sm" className="w-12 h-12" />
                              <div>
                                  <p className="font-bold leading-tight">{user?.name}</p>
                                  <p className="text-sm text-secondary-500">{(user as any).userType === 'BUSINESS' ? 'Business' : 'Personal'}</p>
                              </div>
                          </div>
                      </Link>
                  </div>
                  
                  <div className="space-y-1">
                      {(user as any).userType === 'ADMIN' || (user as any).userType === 'BUSINESS' ? (
                        <Link href="/events/calendar" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 font-semibold text-secondary-900 dark:text-white">
                            <Calendar className="w-5 h-5" /> Events
                        </Link>
                      ) : null}
                      
                      <Link href={`/profile/${(user as any).username || ''}`} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 font-semibold text-secondary-900 dark:text-white">
                          <Library className="w-5 h-5" /> My Posts
                      </Link>
                      
                      {(user as any).userType === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 font-semibold text-primary-600 dark:text-primary-400">
                          <ShieldCheck className="w-5 h-5" /> Admin Panel
                      </Link>
                      )}
                      <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 font-semibold text-secondary-900 dark:text-white">
                      <Settings className="w-5 h-5" /> Settings
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 font-semibold text-secondary-900 dark:text-white">
                      <LogOut className="w-5 h-5" /> Log out
                      </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <button
                className="md:hidden p-3 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                onClick={() => setMobileDrawerOpen(true)}
            >
                <Menu className="w-6 h-6 text-secondary-600 dark:text-secondary-300" />
            </button>
          </div>
        </div>
      </nav>

      {/* PORTAL/OUTSIDE DRAWERS TO AVOID BACKDROP-FILTER CLIPPING */}
      
      {/* Mobile Profile Drawer */}
      {dropdownOpen && (
          <div className="fixed inset-0 z-[150] md:hidden">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDropdownOpen(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-secondary-900 rounded-t-3xl shadow-2xl p-4 animate-slide-up flex flex-col max-h-[80vh]">
                  <div className="flex items-center justify-between mb-4 px-2">
                      <span className="font-bold text-lg text-secondary-900 dark:text-white">Profile</span>
                      <ActionIcon
                          variant="flat"
                          color="secondary"
                          rounded="full"
                          onClick={() => setDropdownOpen(false)}
                      >
                          <X className="w-5 h-5" />
                      </ActionIcon>
                  </div>
                  
                  <div className="overflow-y-auto space-y-4 pb-6">
                      <Link href={`/profile/${(user as any).username || ''}`} onClick={() => setDropdownOpen(false)}>
                          <div className="flex items-center gap-4 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-2xl">
                              <Avatar src={(user?.avatar as string) || undefined} name={user?.name || 'User'} size="md" className="w-16 h-16" />
                              <div>
                                  <p className="font-bold text-lg text-secondary-900 dark:text-white leading-tight">{user?.name}</p>
                                  <p className="text-sm text-secondary-500">{(user as any).userType === 'BUSINESS' ? 'Business Account' : 'Personal Account'}</p>
                              </div>
                          </div>
                      </Link>
                      
                      <div className="space-y-1">
                          {(user as any).userType === 'ADMIN' || (user as any).userType === 'BUSINESS' ? (
                            <Link href="/events/calendar" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 font-semibold text-secondary-900 dark:text-white">
                                <Calendar className="w-5 h-5" /> Events
                            </Link>
                          ) : null}
                          
                          {(user as any).userType === 'ADMIN' && (
                              <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 font-semibold text-primary-600 dark:text-primary-400">
                                  <ShieldCheck className="w-5 h-5" /> Admin Panel
                              </Link>
                          )}
                          <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 font-semibold text-secondary-900 dark:text-white">
                              <Settings className="w-5 h-5" /> Settings
                          </Link>
                          <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 font-semibold text-red-500">
                              <LogOut className="w-5 h-5" /> Log out
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileDrawerOpen && (
          <div className="fixed inset-0 z-[200] md:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileDrawerOpen(false)} />
              <div className="absolute top-0 right-0 w-[85vw] max-w-sm h-full bg-white dark:bg-secondary-900 shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-secondary-100 dark:border-secondary-800">
                    <div className="flex items-center gap-2">
                        <Logo className="w-8 h-8" iconOnly />
                        <span className="font-bold text-xl text-secondary-900 dark:text-white">Menu</span>
                    </div>
                    <ActionIcon
                        variant="flat"
                        color="secondary"
                        rounded="full"
                        onClick={() => setMobileDrawerOpen(false)}
                        className="hover:rotate-90 transition-transform duration-300"
                    >
                        <X className="w-5 h-5" />
                    </ActionIcon>
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
                    <nav className="space-y-1">
                        <p className="px-4 text-xs font-bold text-secondary-400 uppercase tracking-widest mb-2">Navigation</p>
                        <DrawerLink href="/" icon={Home} label="Home" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/'} />
                        <DrawerLink href="/explore" icon={Compass} label="Explore" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/explore'} />
                        <DrawerLink href="/boards" icon={Library} label="Boards" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/boards'} />
                        <DrawerLink href="/notifications" icon={Bell} label="Notifications" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/notifications'} badge={unreadNotifications} />
                        {((user as any)?.userType === 'ADMIN' || (user as any)?.userType === 'BUSINESS') && (
                          <DrawerLink href="/events/calendar" icon={Calendar} label="Events" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/events/calendar'} />
                        )}
                        <DrawerLink href="/messages" icon={MessageSquare} label="Messages" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/messages'} badge={unreadMessages} />
                    </nav>

                    {/* Create Post Section - Only for authorized users */}
                    {( (user as any)?.userType === 'ADMIN' || ((user as any)?.userType === 'BUSINESS' && (user as any)?.verificationStatus === 'VERIFIED') ) && (
                        <div className="space-y-1">
                             <p className="px-4 text-xs font-bold text-secondary-400 uppercase tracking-widest mb-2">Actions</p>
                             <button
                                onClick={() => {
                                    setMobileDrawerOpen(false);
                                    openCreatePost();
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
                             <DrawerLink href="/admin" icon={ShieldCheck} label="Admin Panel" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/admin'} className="text-primary-600 dark:text-primary-400" />
                        )}
                        <DrawerLink href="/settings" icon={Settings} label="Settings" onClick={() => setMobileDrawerOpen(false)} active={pathname === '/settings'} />
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
              </div>
          </div>
      )}
    </>
  );
}

