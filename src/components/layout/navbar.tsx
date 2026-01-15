'use client';

import { Button, Avatar, Popover, Text } from 'rizzui';
import { LogIn, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import Link from 'next/link';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { openLogin } = useAuthModal();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-lg border-b border-secondary-200 dark:border-secondary-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-700 rounded-lg flex items-center justify-center">
              <Text className="text-white font-bold text-xl">GA</Text>
            </div>
            <Text className="text-xl font-bold">Group Ad</Text>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />

            {isAuthenticated && user ? (
              <Popover placement="bottom-end">
                <Popover.Trigger>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="sm"
                    />
                    <Text className="font-medium hidden sm:block">{user.name}</Text>
                  </button>
                </Popover.Trigger>
                <Popover.Content className="p-4 w-56">
                  <div className="space-y-3">
                    <div className="pb-3 border-b border-secondary-200 dark:border-secondary-700">
                      <Text className="font-semibold">{user.name}</Text>
                      <Text className="text-sm text-secondary-600">@{user.username}</Text>
                    </div>

                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
                      <User className="w-4 h-4" />
                      <Text>Profile</Text>
                    </button>

                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
                      <Settings className="w-4 h-4" />
                      <Text>Settings</Text>
                    </button>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <Text>Logout</Text>
                    </button>
                  </div>
                </Popover.Content>
              </Popover>
            ) : (
              <Button
                onClick={() => openLogin()}
                className="bg-primary hover:bg-primary-600"
                size="sm"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
