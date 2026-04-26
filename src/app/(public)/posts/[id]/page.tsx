'use client';

import { useRouter } from 'next/navigation';
import { PostDetailContent } from '@/components/feed/post-detail-content';
import { use } from 'react';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-secondary-50 dark:bg-black px-0 py-4 sm:px-4 md:px-8">
        <PostDetailContent 
            postId={id} 
            isModal={false} 
            onClose={() => router.back()} 
        />
    </div>
  );
}
