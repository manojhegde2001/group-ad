'use client';

import { useEffect } from 'react';
import { usePostDetail } from '@/hooks/use-feed';
import { PostDetailContent } from './post-detail-content';

export function PostDetailDrawer() {
    const { isOpen, post, postId, closePost } = usePostDetail();

    // Body scroll lock
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !postId) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 md:p-6" onClick={closePost}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

            {/* Modal Container */}
            <div
                className="relative z-10 w-full sm:max-w-6xl h-[100dvh] sm:h-[90vh] md:h-[85vh] sm:rounded-2xl overflow-hidden bg-white dark:bg-secondary-900 shadow-2xl animate-slide-up sm:animate-scale-in flex flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()}
            >
                <PostDetailContent 
                    postId={postId} 
                    post={post} 
                    isModal={true} 
                    onClose={closePost} 
                />
            </div>
        </div>
    );
}
