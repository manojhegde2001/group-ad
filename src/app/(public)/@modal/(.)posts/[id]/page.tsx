'use client';

import { useRouter, usePathname } from 'next/navigation';
import { PostDetailContent } from '@/components/feed/post-detail-content';
import { useEffect, use } from 'react';

export default function PostModalPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const { id } = use(params);

  // Scroll lock: lock when on the post route, actively restore when navigating away.
  // We can't rely on unmount cleanup because parallel route slots stay mounted as null.
  useEffect(() => {
    if (pathname === `/posts/${id}`) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [pathname, id]);

  // If the user navigates away from the post route, unmount the modal.
  // This handles the "stays open" issue on hard navigations (like to a profile).
  if (pathname !== `/posts/${id}`) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 md:p-6" onClick={() => router.back()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Modal Container */}
      <div
        className="relative z-10 w-full sm:max-w-6xl min-h-[100dvh] sm:h-[90vh] md:h-[85vh] sm:rounded-2xl overflow-y-auto bg-white dark:bg-secondary-900 shadow-2xl animate-slide-up sm:animate-scale-in flex flex-col scrollbar-none"
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
