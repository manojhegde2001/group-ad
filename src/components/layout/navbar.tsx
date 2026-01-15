'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Avatar, Popover } from 'rizzui';
import { LogIn, LogOut, User, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = () => {
    openLogin();
  };

  const handleSignup = () => {
    openSignup();
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-lg border-b border-secondary-200 dark:border-secondary-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="w-32 h-8 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
            <div className="w-24 h-8 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-lg border-b border-secondary-200 dark:border-secondary-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">GA</span>
            </div>
            <span className="text-xl font-bold hidden sm:block">Group Ad</span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <ThemeSwitcher />

            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : isAuthenticated && user ? (
              <Popover placement="bottom-end">
                <Popover.Trigger>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar src={user.avatar} name={user.name} size="sm" />
                    <span className="font-medium hidden sm:block text-sm">{user.name}</span>
                  </button>
                </Popover.Trigger>
                <Popover.Content className="p-0 w-56 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700">
                  <div className="p-2">
                    {/* User Info */}
                    <div className="px-3 py-2 border-b border-secondary-200 dark:border-secondary-700">
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400">
                        @{user.username}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2 space-y-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors text-sm"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>

                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>

                      <div className="border-t border-secondary-200 dark:border-secondary-700 my-2" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-sm text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </Popover.Content>
              </Popover>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleLogin}
                  variant="outline"
                  color="primary"
                  size="sm"
                  className="hidden sm:flex items-center"
                >
                  Login
                </Button>
                <Button
                  onClick={handleSignup}
                  variant="solid"
                  color="primary"
                  size="sm"
                  className="flex items-center"
                >
                  <LogIn className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
