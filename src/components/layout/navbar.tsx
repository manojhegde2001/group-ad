'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { useCreatePost } from '@/hooks/use-feed';
import { useFeedFilter } from '@/hooks/use-feed';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Loader2,
  X,
  Menu,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { NotificationBell } from '@/components/notifications/notification-bell';

const Logo = dynamic(() => import('../ui/logo'), {
  ssr: false,
  loading: () => <div className="w-28 h-7 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />,
});

export function Navbar() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const { open: openCreatePost } = useCreatePost();
  const { searchQuery, setSearch } = useFeedFilter();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [queryStarted, setQueryStarted] = useState(false);

  // Check for auth=required in URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !queryStarted) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth') === 'required') {
        openLogin();
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      setQueryStarted(true);
    }
  }, [openLogin, queryStarted]);

  useEffect(() => { setMounted(true); }, []);

  // Sync localSearch when the Zustand searchQuery is reset externally (e.g. category change)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 400);
  };

  const clearSearch = () => {
    setLocalSearch('');
    setSearch('');
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRestrictedAction = (e: React.MouseEvent, href: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openLogin();
    }
  };

  // ── Skeleton while not mounted ──────────────────────────────────────────────
  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 glass border-b border-secondary-200/60 dark:border-secondary-800/60">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
          <div className="w-28 h-7 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse shrink-0" />
          <div className="flex-1 h-9 bg-secondary-100 dark:bg-secondary-800 rounded-full animate-pulse hidden sm:block" />
          <div className="w-20 h-8 bg-secondary-100 dark:bg-secondary-700 rounded animate-pulse ml-auto" />
        </div>
      </nav>
    );
  }

  // ── Search bar shared component ─────────────────────────────────────────────
  const SearchBar = ({ className = '', autoFocus = false }: { className?: string; autoFocus?: boolean }) => (
    <div className={`relative ${className}`}>
      <div
        className={`flex items-center gap-2 bg-secondary-100 dark:bg-secondary-800 rounded-full px-4 py-2 transition-all duration-200 ${searchFocused
          ? 'ring-2 ring-primary-400 bg-white dark:bg-secondary-700 shadow-sm'
          : 'hover:bg-secondary-200 dark:hover:bg-secondary-700'
          }`}
      >
        <Search className="w-4 h-4 text-secondary-400 shrink-0" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search posts, people, ideas…"
          autoFocus={autoFocus}
          className="flex-1 bg-transparent outline-none text-sm text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400 min-w-0"
        />
        {localSearch && (
          <button
            onClick={clearSearch}
            className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-colors shrink-0"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 glass border-b border-secondary-200/60 dark:border-secondary-800/60">
      {/* ── Main bar ─────────────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3">

        {/* ZONE 1 — Logo (start, fixed width) */}
        <div className="flex items-center shrink-0 gap-8">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Logo className="w-24 sm:w-28 h-7 sm:h-8" />
          </Link>
        </div>

        {/* ZONE 2 — Search (center, grows) */}
        <div className="hidden sm:flex flex-1 justify-center px-2 md:px-4">
          <SearchBar className="w-full max-w-xl" />
        </div>

        {/* ZONE 3 — Actions (end) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">

          {/* Mobile search toggle */}
          <button
            className="sm:hidden p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Toggle search"
          >
            {mobileSearchOpen
              ? <X className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              : <Search className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            }
          </button>

          {/* Theme switcher */}
          <ThemeSwitcher />

          {/* Notifications (Show on sm+ if authenticated) */}
          {isAuthenticated && user && (
            <div className="hidden sm:block">
              <NotificationBell />
            </div>
          )}

          {/* Auth state Desktop */}
          <div className="hidden sm:flex items-center gap-1.5">
            {loading || isLoggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary-500 mx-1 sm:mx-2" />
            ) : isAuthenticated && user ? (
              <>
                <Link href="/events/calendar" onClick={(e) => handleRestrictedAction(e, '/events/calendar')}>
                  <Button
                    variant="text"
                    color="secondary"
                    size="sm"
                    rounded="pill"
                    leftIcon={<Calendar className="w-4 h-4" />}
                    className="!text-secondary-700 dark:!text-secondary-300 hover:!bg-secondary-100 dark:hover:!bg-secondary-800 !px-3 md:!px-4"
                  >
                    <span className="hidden md:inline">Events</span>
                  </Button>
                </Link>

                <Button
                  onClick={openCreatePost}
                  variant="solid"
                  color="primary"
                  size="sm"
                  rounded="pill"
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="!px-3 md:!px-4 gap-1 shadow-sm hover:shadow-md transition-all"
                >
                  <span className="hidden md:inline">Create</span>
                </Button>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                  >
                    <Avatar
                      src={(user.avatar as string | null | undefined) ?? undefined}
                      name={(user.name as string) || 'User'}
                      size="sm"
                      rounded="full"
                      color="primary"
                      className="w-8 h-8 ring-2 ring-primary-200 dark:ring-primary-800"
                    />
                    <ChevronDown className={`w-3.5 h-3.5 text-secondary-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-secondary-900 rounded-2xl shadow-xl border border-secondary-100 dark:border-secondary-800 overflow-hidden z-50">
                      <div className="px-4 py-3 bg-primary-50/50 dark:bg-primary-900/10 border-b border-secondary-100 dark:border-secondary-800">
                        <p className="font-semibold text-sm text-secondary-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-secondary-500">@{(user as any).username}</p>
                      </div>
                      <div className="p-1.5">
                        <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors text-sm">
                          <User className="w-4 h-4" /> My Profile
                        </Link>
                        {(user as any).userType === 'ADMIN' && (
                          <Link href="/admin/events" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors text-sm">
                            <Plus className="w-4 h-4" /> Admin Panel
                          </Link>
                        )}
                        <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors text-sm">
                          <Settings className="w-4 h-4" /> Settings
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm">
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button onClick={() => openLogin()} variant="text" color="secondary" size="sm">Log in</Button>
                <Button onClick={() => openSignup()} variant="solid" size="sm" rounded="pill" className="!bg-secondary-900 dark:!bg-white !text-white dark:!text-secondary-900">Sign up</Button>
              </>
            )}
          </div>

          {/* Unified Mobile Hamburger */}
          <div className="sm:hidden relative" ref={mobileMenuRef}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors flex items-center gap-1"
            >
              {isAuthenticated && user && <NotificationBell />}
              <Menu className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-[85vw] max-w-xs bg-white dark:bg-secondary-900 rounded-3xl shadow-2xl border border-secondary-100 dark:border-secondary-800 overflow-hidden animate-scale-in z-50">
                {isAuthenticated && user && (
                  <div className="px-6 py-5 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border-b border-secondary-100 dark:border-secondary-800">
                    <div className="flex items-center gap-3 mb-1">
                      <Avatar src={(user.avatar as string) || undefined} name={user.name || 'U'} size="sm" />
                      <div>
                        <p className="font-bold text-secondary-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-secondary-500">@{(user as any).username}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-2 space-y-1">
                  <Link href="/events/calendar" onClick={(e) => { handleRestrictedAction(e, '/events/calendar'); setMobileMenuOpen(false); }} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
                    <Calendar className="w-5 h-5 text-secondary-500" />
                    <span className="font-semibold text-secondary-800 dark:text-secondary-200">Events Calendar</span>
                  </Link>

                  {isAuthenticated ? (
                    <>
                      <button onClick={() => { openCreatePost(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-primary-600">
                        <Plus className="w-5 h-5" />
                        <span className="font-bold">Create Post</span>
                      </button>
                      <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
                        <User className="w-5 h-5 text-secondary-500" />
                        <span className="font-semibold text-secondary-800 dark:text-secondary-200">My Profile</span>
                      </Link>
                      {(user as any).userType === 'ADMIN' && (
                        <Link href="/admin/events" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-primary-50/50 dark:bg-primary-900/10 text-primary-700">
                          <ShieldCheck className="w-5 h-5" />
                          <span className="font-bold">Admin Panel</span>
                        </Link>
                      )}
                      <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
                        <Settings className="w-5 h-5 text-secondary-500" />
                        <span className="font-semibold text-secondary-800 dark:text-secondary-200">Settings</span>
                      </Link>
                      <div className="my-2 border-t border-secondary-100 dark:border-secondary-800 mx-2" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-red-50 text-red-500 transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="font-bold">Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { openLogin(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
                        <User className="w-5 h-5 text-secondary-500" />
                        <span className="font-semibold">Log in</span>
                      </button>
                      <button onClick={() => { openSignup(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-bold">
                        <Plus className="w-5 h-5" />
                        <span>Sign up</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile expanded search ─────────────────────────────────────────── */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-3 pb-3 animate-slide-up">
          <SearchBar className="w-full" autoFocus />
        </div>
      )}
    </nav>
  );
}
