'use client';

import { useRouter } from 'next/navigation';
import { PostDetailContent } from '@/components/feed/post-detail-content';
import { use } from 'react';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-secondary-50 dark:bg-black flex flex-col items-center justify-center sm:p-4 md:p-8">
      <div className="w-full max-w-6xl bg-white dark:bg-secondary-900 sm:rounded-2xl overflow-hidden shadow-xl min-h-[500px] flex flex-col md:flex-row">
        <PostDetailContent 
            postId={id} 
            isModal={false} 
            onClose={() => router.back()} 
        />
      </div>
    </div>
  );
}
