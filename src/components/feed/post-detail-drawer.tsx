'use client';

import { usePostDetail } from '@/hooks/use-feed';
import { PostDetailContent } from './post-detail-content';
import { Modal } from 'rizzui';

export function PostDetailDrawer() {
    const { isOpen, post, postId, closePost } = usePostDetail();

    if (!postId) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={closePost}
            containerClassName="flex items-end sm:items-center justify-center sm:p-4 md:p-6"
        >
            <div
                className="relative w-full sm:max-w-6xl h-[100dvh] sm:h-[90vh] md:h-[85vh] sm:rounded-2xl overflow-hidden bg-white dark:bg-secondary-900 shadow-2xl flex flex-col md:flex-row m-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <PostDetailContent 
                    postId={postId} 
                    post={post} 
                    isModal={true} 
                    onClose={closePost} 
                />
            </div>
        </Modal>
    );
}
