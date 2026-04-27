'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, User, Menu, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useMe } from '@/hooks/use-api/use-user';
import { Avatar } from '@/components/ui/avatar';

interface MobileBottomNavProps {
    onMenuClick: () => void;
    onSearchClick?: () => void;
}

export function MobileBottomNav({ onMenuClick, onSearchClick }: MobileBottomNavProps) {
    const pathname = usePathname();
    const { isAuthenticated, user: authUser } = useAuth();
    const { data: meUser } = useMe();
    const user = meUser || authUser;

    if (!isAuthenticated) return null;

    const navItems = [
        { icon: Home, label: 'Home', href: '/', active: pathname === '/' },
        { icon: Search, label: 'Search', href: '/explore', active: pathname === '/explore', onClick: onSearchClick },
        { icon: User, label: 'Profile', href: `/profile/${user?.username || ''}`, active: pathname.startsWith('/profile') },
        { icon: Menu, label: 'More', onClick: onMenuClick },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 dark:bg-secondary-900/80 backdrop-blur-lg border-t border-secondary-100 dark:border-secondary-800 px-6 py-3 pb-safe-area-inset-bottom">
            <div className="flex items-center justify-between max-w-md mx-auto">
                {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = item.active;

                    if (item.href) {
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                onClick={item.onClick}
                                className={cn(
                                    "flex flex-col items-center gap-1 transition-all active:scale-90",
                                    isActive ? "text-secondary-900 dark:text-white" : "text-secondary-400 dark:text-secondary-500"
                                )}
                            >
                                {item.label === 'Profile' && user?.avatar ? (
                                    <div className={cn(
                                        "w-6 h-6 rounded-full overflow-hidden ring-2 transition-all",
                                        isActive ? "ring-secondary-900 dark:ring-white" : "ring-transparent"
                                    )}>
                                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                                )}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={index}
                            onClick={item.onClick}
                            className="flex flex-col items-center gap-1 text-secondary-400 dark:text-secondary-500 active:scale-90 transition-all"
                        >
                            <Icon className="w-6 h-6" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
