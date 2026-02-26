'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { useCreatePost } from '@/hooks/use-feed';
import { useFeedFilter } from '@/hooks/use-feed';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import {
  Search,
  Plus,
  Bell,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';

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
  const [searchFocused, setSearchFocused] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
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

  const handleLogout = async () => {
    setDropdownOpen(false);
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 glass border-b border-secondary-200/60 dark:border-secondary-800/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="w-28 h-7 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
          <div className="flex-1 h-9 bg-secondary-100 dark:bg-secondary-800 rounded-full animate-pulse" />
          <div className="w-20 h-8 bg-secondary-100 dark:bg-secondary-700 rounded animate-pulse" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-secondary-200/60 dark:border-secondary-800/60">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0 hover:opacity-80 transition-opacity">
          <Logo className="w-28 h-8" />
        </Link>

        {/* Search Bar */}
        <div className={`flex-1 max-w-xl mx-2 relative transition-all duration-200 ${searchFocused ? 'max-w-2xl' : ''}`}>
          <div className={`flex items-center gap-2 bg-secondary-100 dark:bg-secondary-800 rounded-full px-4 py-2 transition-all ${searchFocused ? 'ring-2 ring-primary-400 bg-white dark:bg-secondary-700' : 'hover:bg-secondary-200 dark:hover:bg-secondary-700'}`}>
            <Search className="w-4 h-4 text-secondary-500 shrink-0" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search posts, people, ideas..."
              className="flex-1 bg-transparent outline-none text-sm text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400 min-w-0"
            />
            {localSearch && (
              <button onClick={() => { setLocalSearch(''); setSearch(''); }} className="text-secondary-400 hover:text-secondary-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeSwitcher />

          {loading || isLoggingOut ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : isAuthenticated && user ? (
            <>
              {/* Create Post Button */}
              <button
                onClick={openCreatePost}
                className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-primary-200 dark:hover:shadow-primary-900/40 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
              </button>

              {/* Notification Bell */}
              <button className="relative p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
                <Bell className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                {/* Unread badge */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden ring-2 ring-primary-200 dark:ring-primary-800">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name as string} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {(user.name as string)?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-secondary-500 transition-transform duration-200 hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-secondary-900 rounded-2xl shadow-xl border border-secondary-100 dark:border-secondary-800 overflow-hidden animate-scale-in">
                    {/* User Info Header */}
                    <div className="px-4 py-3 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border-b border-secondary-100 dark:border-secondary-800">
                      <p className="font-semibold text-sm text-secondary-900 dark:text-white truncate">{user.name as string}</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">@{(user as any).username}</p>
                    </div>

                    <div className="p-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors text-sm text-secondary-700 dark:text-secondary-300"
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors text-sm text-secondary-700 dark:text-secondary-300"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>

                      <div className="my-1 border-t border-secondary-100 dark:border-secondary-800" />

                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 dark:text-red-400 transition-colors text-sm disabled:opacity-50"
                      >
                        {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                        <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={openLogin}
                className="px-4 py-2 rounded-full text-sm font-semibold text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={openSignup}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 hover:opacity-90 transition-all active:scale-95"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
