'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, User, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { CloudinaryImage } from '@/components/ui/cloudinary-image';
import { useMe } from '@/hooks/use-api/use-user';
import { useAuthModal } from '@/hooks/use-modal';

interface MobileBottomNavProps {
    onMenuClick: () => void;
    onSearchClick?: () => void;
    unreadCount?: number;
}

export function MobileBottomNav({ onMenuClick, onSearchClick, unreadCount = 0 }: MobileBottomNavProps) {
    const pathname = usePathname();
    const { isAuthenticated, user: authUser } = useAuth();
    const { data: meUser } = useMe();
    const user = meUser || authUser;
    const { openLogin } = useAuthModal();

    const navItems = isAuthenticated ? [
        { icon: Home, label: 'Home', href: '/', active: pathname === '/' },
        { icon: Search, label: 'Search', href: '/explore', active: pathname === '/explore', onClick: onSearchClick },
        { icon: User, label: 'Profile', href: `/profile/${user?.username || ''}`, active: pathname.startsWith('/profile') },
        { icon: Menu, label: 'More', onClick: onMenuClick },
    ] : [
        { icon: Home, label: 'Home', href: '/', active: pathname === '/' },
        { icon: Search, label: 'Explore', href: '/explore', active: pathname === '/explore', onClick: onSearchClick },
        { icon: User, label: 'Log In', onClick: openLogin },
        { icon: Menu, label: 'Menu', onClick: onMenuClick },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 dark:bg-secondary-900/90 backdrop-blur-lg border-t border-secondary-100 dark:border-secondary-800 px-2 sm:px-6 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between max-w-md mx-auto">
                {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = item.active;

                    if (item.href) {
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                onClick={item.onClick ? () => item.onClick!() : undefined}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 transition-all active:scale-95 p-2 min-w-[4rem]",
                                    isActive ? "text-secondary-900 dark:text-white" : "text-secondary-400 dark:text-secondary-500"
                                )}
                            >
                                {item.label === 'Profile' && user?.avatar ? (
                                    <div className={cn(
                                        "w-[1.375rem] h-[1.375rem] rounded-full overflow-hidden ring-2 transition-all",
                                        isActive ? "ring-secondary-900 dark:ring-white" : "ring-transparent"
                                    )}>
                                        <div className="w-full h-full rounded-full overflow-hidden relative">
                                            <CloudinaryImage src={user.avatar} alt="" fill className="object-cover" />
                                        </div>
                                    </div>
                                ) : (
                                    <Icon className={cn("w-[1.375rem] h-[1.375rem]", isActive && "stroke-[2.5px]")} />
                                )}
                                <span className={cn("text-[10px] font-medium leading-none", isActive ? "font-bold" : "")}>{item.label}</span>
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={index}
                            onClick={item.onClick ? () => item.onClick!() : undefined}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1 transition-all active:scale-95 p-2 min-w-[4rem] text-secondary-400 dark:text-secondary-500"
                            )}
                        >
                            <span className="relative">
                                <Icon className="w-[1.375rem] h-[1.375rem]" />
                                {item.label === 'More' && unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-secondary-900" aria-hidden="true" />
                                )}
                            </span>
                            <span className="text-[10px] font-medium leading-none">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
