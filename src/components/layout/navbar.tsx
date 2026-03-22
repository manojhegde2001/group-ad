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
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { SearchBar } from './search-bar';
import { ActionIcon } from '../ui/action-icon';
import { cn } from '@/lib/utils';

const Logo = dynamic(() => import('../ui/logo'), {
  ssr: false,
  loading: () => <div className="w-8 h-8 md:w-28 md:h-7 bg-secondary-200 dark:bg-secondary-700 rounded-full md:rounded animate-pulse" />,
});

export function Navbar() {
  const { user: authUser, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { data: meUser, isLoading: meLoading } = useMe();
  const user = meUser || authUser;
  const loading = authLoading || (isAuthenticated && meLoading && !meUser);

  const { openLogin, openSignup } = useAuthModal();
  const { searchQuery, setSearch } = useFeedFilter();
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
                <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-secondary-900 sm:bg-white/95 sm:dark:bg-secondary-900/95 sm:backdrop-blur-md rounded-2xl shadow-2xl border border-secondary-100 dark:border-secondary-800 overflow-hidden z-[200] p-2 animate-in fade-in zoom-in duration-200 hidden md:block">
                  <div className="px-3 py-3 rounded-xl mb-1 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors cursor-pointer text-secondary-900 dark:text-white">
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
                      <Link href="/events/calendar" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 font-semibold text-secondary-900 dark:text-white">
                          <Calendar className="w-5 h-5" /> Events
                      </Link>
                      
                      {(user as any).userType === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 font-semibold text-primary-600 dark:text-primary-400">
                          <ShieldCheck className="w-5 h-5" /> Admin Panel
                      </Link>
                      )}
                      <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 font-semibold text-secondary-900 dark:text-white">
                      <Settings className="w-5 h-5" /> Settings
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 font-semibold text-secondary-900 dark:text-white">
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
                          <Link href="/events/calendar" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 font-semibold text-secondary-900 dark:text-white">
                              <Calendar className="w-5 h-5" /> Events
                          </Link>
                          
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
          <div className="fixed inset-0 z-[100] md:hidden">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
              <div className="absolute top-0 right-0 w-[80vw] max-w-sm h-full bg-white dark:bg-secondary-900 shadow-2xl z-50 flex flex-col p-6 animate-slide-in-right">
                <div className="flex items-center justify-between mb-8">
                    <span className="font-bold text-lg text-secondary-900 dark:text-white">Menu</span>
                    <ActionIcon
                        variant="flat"
                        color="secondary"
                        rounded="full"
                        onClick={() => setMobileDrawerOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </ActionIcon>
                </div>
                <nav className="flex flex-col gap-4 font-bold text-secondary-900 dark:text-white">
                    <Link href="/" onClick={() => setMobileDrawerOpen(false)}>Home</Link>
                    <Link href="/explore" onClick={() => setMobileDrawerOpen(false)}>Explore</Link>
                    <Link href="/messages" onClick={() => setMobileDrawerOpen(false)}>Messages</Link>
                    <Link href="/notifications" onClick={() => setMobileDrawerOpen(false)}>Notifications</Link>
                    <div className="h-[1px] bg-secondary-100 dark:bg-secondary-800 my-2" />
                    <Link href="/settings" onClick={() => setMobileDrawerOpen(false)}>Settings</Link>
                    <button onClick={handleLogout} className="text-left text-red-500">Log out</button>
                </nav>
              </div>
          </div>
      )}
    </>
  );
}

