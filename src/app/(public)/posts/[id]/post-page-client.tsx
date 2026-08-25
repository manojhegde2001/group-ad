'use client';

import { useRouter } from 'next/navigation';
import { PostDetailContent } from '@/components/feed/post-detail-content';

export function PostPageClient({ postId }: { postId: string }) {
  const router = useRouter();

  return (
    <PostDetailContent
      postId={postId}
      isModal={false}
      onClose={() => router.back()}
    />
  );
}
