'use client';

import { useState, useCallback } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';

interface BookmarkButtonProps {
    postId: string;
    initialBookmarked?: boolean;
    size?: 'sm' | 'md';
    showLabel?: boolean;
}

export function BookmarkButton({
    postId,
    initialBookmarked = false,
    size = 'sm',
    showLabel = false,
}: BookmarkButtonProps) {
    const { isAuthenticated } = useAuth();
    const { openLogin } = useAuthModal();
    const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
    const [loading, setLoading] = useState(false);

    const toggle = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (!isAuthenticated) {
                openLogin();
                return;
            }

            if (loading) return;

            // Optimistic update
            const prev = isBookmarked;
            setIsBookmarked(!prev);
            setLoading(true);

            try {
                const res = await fetch(`/api/bookmarks/${postId}`, {
                    method: prev ? 'DELETE' : 'POST',
                });
                if (!res.ok) {
                    // Revert on failure
                    setIsBookmarked(prev);
                }
            } catch {
                setIsBookmarked(prev);
            } finally {
                setLoading(false);
            }
        },
        [isAuthenticated, isBookmarked, loading, openLogin, postId]
    );

    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    const btnSize = size === 'sm' ? 'p-1.5' : 'p-2';

    return (
        <button
            onClick={toggle}
            disabled={loading}
            title={isBookmarked ? 'Remove bookmark' : 'Save post'}
            className={`${btnSize} rounded-full transition-all duration-200 flex items-center gap-1 disabled:opacity-60 ${isBookmarked
                    ? 'text-primary-600 dark:text-primary-400 hover:text-primary-700'
                    : 'text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200'
                }`}
        >
            {isBookmarked ? (
                <BookmarkCheck className={`${iconSize} fill-current`} />
            ) : (
                <Bookmark className={iconSize} />
            )}
            {showLabel && (
                <span className="text-xs font-medium">
                    {isBookmarked ? 'Saved' : 'Save'}
                </span>
            )}
        </button>
    );
}
