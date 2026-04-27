'use client';

import { useRouter } from 'next/navigation';
import { PostDetailContent } from '@/components/feed/post-detail-content';
import { use } from 'react';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  return (
    <PostDetailContent 
        postId={id} 
        isModal={false} 
        onClose={() => router.back()} 
    />
  );
}
