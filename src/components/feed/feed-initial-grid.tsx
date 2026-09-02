import Link from 'next/link';
import { AppImage } from '@/components/ui/app-image';
import { PostCardSkeleton } from './post-card-skeleton';
import type { PostWithRelations } from '@/types';

// Same varied spread as PostCardSkeleton so the pre-hydration column flow matches
// the skeleton it replaces. Once <Masonry> mounts it re-measures from real DOM.
const HEIGHTS = [232, 300, 208, 344, 260, 372, 220, 312, 244, 332, 284, 292];

const isVideo = (src: string) =>
  src.includes('/video/upload/') || /\.(mp4|mov|avi|webm|mkv)/i.test(src);

interface FeedInitialGridProps {
  posts: PostWithRelations[];
  /** How many leading posts render a real (network-fetched) image. */
  realCount?: number;
}

/**
 * Server-rendered first screen of the feed. Emits real <img> markup (and the
 * card chrome) into the SSR HTML so the LCP element is a genuine image instead
 * of the shimmer skeleton, which previously only appeared after hydration +
 * <Masonry> mount. After the client mounts, feed-container swaps this out for
 * the interactive masonry grid — the same swap point that already existed for
 * <FeedSkeleton>, so no new layout flash is introduced.
 */
export function FeedInitialGrid({ posts, realCount = 8 }: FeedInitialGridProps) {
  const visible = posts.slice(0, realCount);
  const remainder = Math.max(0, 12 - visible.length);

  return (
    <div className="columns-2 md:columns-3 xl:columns-4 2xl:columns-5 gap-1.5 [column-fill:balance]">
      {visible.map((post, i) => {
        const src = post.images?.[0];
        const height = HEIGHTS[i % HEIGHTS.length];
        return (
          <div key={post.id} className="mb-1.5 break-inside-avoid">
            <Link
              href={`/posts/${post.id}`}
              className="group relative rounded-lg overflow-hidden bg-white dark:bg-secondary-900 shadow-sm block border border-secondary-100/50 dark:border-secondary-800/30"
            >
              <div
                className="relative overflow-hidden bg-secondary-100 dark:bg-secondary-800"
                style={{ height }}
              >
                {src && !isVideo(src) ? (
                  <AppImage
                    src={src}
                    alt={post.content || ''}
                    fill
                    className="w-full h-full object-cover block"
                    priority={i < 4}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-600 p-6 flex items-start">
                    <p className="text-white text-[13px] md:text-[12px] font-bold md:font-semibold leading-relaxed line-clamp-6 tracking-tight drop-shadow-md">
                      {post.content}
                    </p>
                  </div>
                )}
              </div>
              {post.content && (
                <div className="px-2 md:px-4 py-2.5 md:py-3">
                  <p className="text-[11px] md:text-[12px] font-bold md:font-semibold text-secondary-900 dark:text-secondary-100 leading-tight line-clamp-2 tracking-tight">
                    {post.content}
                  </p>
                </div>
              )}
            </Link>
          </div>
        );
      })}
      {Array.from({ length: remainder }).map((_, i) => (
        <div key={`sk-${i}`} className="mb-1.5 break-inside-avoid">
          <PostCardSkeleton index={visible.length + i} />
        </div>
      ))}
    </div>
  );
}
