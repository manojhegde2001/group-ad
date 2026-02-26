'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Masonry from 'react-masonry-css';
import { PostCard } from './post-card';
import { CategoryBar } from './category-bar';
import { useFeedFilter } from '@/hooks/use-feed';
import type { PostWithRelations } from '@/types';
import { Loader2, ImageOff } from 'lucide-react';

// Demo posts used as fallback when DB is empty  
const DEMO_POSTS: any[] = [
  {
    id: 'demo-1', type: 'IMAGE', content: 'Modern UI Design Trends for 2026 — clean interfaces, micro-animations, and purposeful whitespace.',
    images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80'],
    tags: ['design', 'ui'], visibility: 'PUBLIC', views: 1420, likes: 1234, shares: 45,
    userId: 'd1', categoryId: null, companyId: null, createdAt: new Date(), updatedAt: new Date(),
    user: { id: 'd1', name: 'Sarah Johnson', username: 'sarahj', avatar: 'https://i.pravatar.cc/150?img=5', userType: 'INDIVIDUAL', verificationStatus: 'VERIFIED' },
    category: { id: 'c1', name: 'Design', slug: 'design', icon: '🎨' },
    company: null, _count: { postLikes: 1234, postComments: 45 },
  },
  {
    id: 'demo-2', type: 'IMAGE', content: 'Scalable web architecture patterns that will shape the future of enterprise apps.',
    images: ['https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&q=80'],
    tags: ['tech'], visibility: 'PUBLIC', views: 870, likes: 892, shares: 32,
    userId: 'd2', categoryId: null, companyId: null, createdAt: new Date(), updatedAt: new Date(),
    user: { id: 'd2', name: 'Mike Chen', username: 'mikec', avatar: 'https://i.pravatar.cc/150?img=11', userType: 'BUSINESS', verificationStatus: 'UNVERIFIED' },
    category: { id: 'c2', name: 'Technology', slug: 'technology', icon: '💻' },
    company: null, _count: { postLikes: 892, postComments: 32 },
  },
  {
    id: 'demo-3', type: 'TEXT', content: '"The best marketing strategy ever: CARE. Show your audience you genuinely care about their problems and watch your brand grow 10x." — Key insight for 2026.',
    images: [], tags: ['marketing'], visibility: 'PUBLIC', views: 2100, likes: 2156, shares: 78,
    userId: 'd3', categoryId: null, companyId: null, createdAt: new Date(), updatedAt: new Date(),
    user: { id: 'd3', name: 'Emma Wilson', username: 'emmaw', avatar: 'https://i.pravatar.cc/150?img=9', userType: 'BUSINESS', verificationStatus: 'VERIFIED' },
    category: { id: 'c3', name: 'Business', slug: 'business', icon: '💼' },
    company: null, _count: { postLikes: 2156, postComments: 78 },
  },
  {
    id: 'demo-4', type: 'IMAGE', content: 'Sustainable living tips that actually make a difference — small changes, big impact.',
    images: ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&q=80'],
    tags: ['lifestyle'], visibility: 'PUBLIC', views: 560, likes: 567, shares: 23,
    userId: 'd4', categoryId: null, companyId: null, createdAt: new Date(), updatedAt: new Date(),
    user: { id: 'd4', name: 'Alex Green', username: 'alexg', avatar: 'https://i.pravatar.cc/150?img=3', userType: 'INDIVIDUAL', verificationStatus: 'UNVERIFIED' },
    category: { id: 'c4', name: 'Lifestyle', slug: 'lifestyle', icon: '🌿' },
    company: null, _count: { postLikes: 567, postComments: 23 },
  },
  {
    id: 'demo-5', type: 'IMAGE', content: 'AI & Machine Learning fundamentals — understanding neural networks from first principles.',
    images: ['https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&q=80'],
    tags: ['ai', 'ml'], visibility: 'PUBLIC', views: 3400, likes: 3421, shares: 156,
    userId: 'd5', categoryId: null, companyId: null, createdAt: new Date(), updatedAt: new Date(),
    user: { id: 'd5', name: 'David Kim', username: 'davidk', avatar: 'https://i.pravatar.cc/150?img=7', userType: 'INDIVIDUAL', verificationStatus: 'VERIFIED' },
    category: { id: 'c2', name: 'Technology', slug: 'technology', icon: '💻' },
    company: null, _count: { postLikes: 3421, postComments: 156 },
  },
  {
    id: 'demo-6', type: 'IMAGE', content: 'Photography composition guide — mastering the rule of thirds and leading lines.',
    images: ['https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=500&q=80'],
    tags: ['photography'], visibility: 'PUBLIC', views: 789, likes: 789, shares: 34,
    userId: 'd6', categoryId: null, companyId: null, createdAt: new Date(), updatedAt: new Date(),
    user: { id: 'd6', name: 'Lisa Brown', username: 'lisab', avatar: 'https://i.pravatar.cc/150?img=1', userType: 'INDIVIDUAL', verificationStatus: 'UNVERIFIED' },
    category: { id: 'c5', name: 'Photography', slug: 'photography', icon: '📸' },
    company: null, _count: { postLikes: 789, postComments: 34 },
  },
  {
    id: 'demo-7', type: 'TEXT', content: 'Startup lesson #47: Your first 100 customers are NOT your target market. They are your co-founders. Listen to every single one of them.',
    images: [], tags: ['startup'], visibility: 'PUBLIC', views: 4200, likes: 4100, shares: 210,
    userId: 'd7', categoryId: null, companyId: null, createdAt: new Date(), updatedAt: new Date(),
    user: { id: 'd7', name: 'Raj Patel', username: 'rajp', avatar: 'https://i.pravatar.cc/150?img=12', userType: 'BUSINESS', verificationStatus: 'VERIFIED' },
    category: { id: 'c3', name: 'Business', slug: 'business', icon: '💼' },
    company: null, _count: { postLikes: 4100, postComments: 210 },
  },
  {
    id: 'demo-8', type: 'IMAGE', content: 'Modern architecture that merges form and function beautifully.',
    images: ['https://images.unsplash.com/photo-1486325212027-8081e485255e?w=500&q=80'],
    tags: ['architecture'], visibility: 'PUBLIC', views: 1200, likes: 1100, shares: 55,
    userId: 'd8', categoryId: null, companyId: null, createdAt: new Date(), updatedAt: new Date(),
    user: { id: 'd8', name: 'Anika Sharma', username: 'anikas', avatar: 'https://i.pravatar.cc/150?img=16', userType: 'INDIVIDUAL', verificationStatus: 'UNVERIFIED' },
    category: { id: 'c6', name: 'Architecture', slug: 'architecture', icon: '🏛️' },
    company: null, _count: { postLikes: 1100, postComments: 55 },
  },
];

const breakpointCols = {
  default: 5,
  1800: 5,
  1536: 4,
  1280: 4,
  1024: 3,
  768: 2,
  640: 2,
  480: 1,
  0: 1,
};

export function FeedContainer() {
  const { selectedCategoryId, searchQuery } = useFeedFilter();
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [useDemoData, setUseDemoData] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: '20',
          visibility: 'PUBLIC',
        });
        if (selectedCategoryId) params.set('categoryId', selectedCategoryId);
        if (searchQuery) params.set('search', searchQuery);

        const res = await fetch(`/api/posts?${params}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const newPosts: PostWithRelations[] = data.posts || [];

        if (reset) {
          if (newPosts.length === 0 && pageNum === 1) {
            setUseDemoData(true);
            setPosts(DEMO_POSTS as any);
            setHasMore(false);
          } else {
            setUseDemoData(false);
            setPosts(newPosts);
            setHasMore(pageNum < data.pagination?.totalPages);
          }
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
          setHasMore(pageNum < data.pagination?.totalPages);
        }
      } catch {
        if (pageNum === 1) {
          setUseDemoData(true);
          setPosts(DEMO_POSTS as any);
          setHasMore(false);
        }
      }
    },
    [selectedCategoryId, searchQuery]
  );

  // Reset + refetch when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setPosts([]);
    fetchPosts(1, true).finally(() => setLoading(false));
  }, [selectedCategoryId, searchQuery, fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    if (useDemoData) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage, false).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: '300px' }
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, page, fetchPosts, useDemoData]);

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-6">
        <div className="columns-1 xs:columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`mb-3 break-inside-avoid rounded-2xl bg-secondary-100 dark:bg-secondary-800 animate-pulse ${i % 3 === 0 ? 'h-64' : i % 3 === 1 ? 'h-40' : 'h-52'
                }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <ImageOff className="w-16 h-16 text-secondary-300 mb-4" />
        <h3 className="text-xl font-semibold text-secondary-700 dark:text-secondary-300 mb-2">No posts found</h3>
        <p className="text-secondary-500 max-w-sm">
          {searchQuery
            ? `No results for "${searchQuery}". Try a different search.`
            : 'No posts in this category yet. Be the first to post!'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-5">
      {useDemoData && (
        <p className="text-center text-xs text-secondary-400 mb-4">
          Showing sample posts — create posts to see real content
        </p>
      )}

      <Masonry
        breakpointCols={breakpointCols}
        className="flex -ml-3 w-auto"
        columnClassName="pl-3 bg-clip-padding"
      >
        {posts.map((post, i) => (
          <div
            key={post.id}
            className="mb-3 animate-slide-up opacity-0"
            style={{ animationDelay: `${Math.min(i * 40, 400)}ms`, animationFillMode: 'forwards' }}
          >
            <PostCard post={post} />
          </div>
        ))}
      </Masonry>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      )}

      {!hasMore && posts.length > 0 && !useDemoData && (
        <p className="text-center text-sm text-secondary-400 py-8">
          You've seen all posts ✨
        </p>
      )}
    </div>
  );
}
