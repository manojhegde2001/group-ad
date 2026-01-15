'use client';

import { useEffect, useState } from 'react';
import { MasonryLayout } from './masonry-layout';
import { PostCard } from './post-card';
import type { Post } from '@/types';
import { Loader, Text } from 'rizzui';

export function FeedContainer() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts?limit=20');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="xl" variant="spinner" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Text className="text-xl text-secondary-600 dark:text-secondary-400">
          No posts yet. Be the first to share!
        </Text>
      </div>
    );
  }

  return (
    <MasonryLayout>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </MasonryLayout>
  );
}
