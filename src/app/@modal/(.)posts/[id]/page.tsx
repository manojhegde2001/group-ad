'use client';

import { useRouter } from 'next/navigation';
import { PostDetailContent } from '@/components/feed/post-detail-content';
import { useEffect, use } from 'react';

export default function PostModalPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 md:p-6" onClick={() => router.back()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Modal Container */}
      <div
        className="relative z-10 w-full sm:max-w-6xl h-[100dvh] sm:h-[90vh] md:h-[85vh] sm:rounded-2xl overflow-hidden bg-white dark:bg-secondary-900 shadow-2xl animate-slide-up sm:animate-scale-in flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <PostDetailContent 
          postId={id} 
          isModal={true} 
          onClose={() => router.back()} 
        />
      </div>
    </div>
  );
}
