'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { useBookmarkPost } from '@/hooks/use-api/use-posts';

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
    
    const bookmarkMutation = useBookmarkPost();
    const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

    const toggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            openLogin();
            return;
        }

        const nextState = !isBookmarked;
        setIsBookmarked(nextState);
        
        bookmarkMutation.mutate(
            { postId, isBookmarked: nextState },
            {
                onError: () => {
                    setIsBookmarked(!nextState); // Revert on failure
                }
            }
        );
    };

    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    const btnSize = size === 'sm' ? 'p-1.5' : 'p-2';

    return (
        <button
            onClick={toggle}
            disabled={bookmarkMutation.isPending}
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
