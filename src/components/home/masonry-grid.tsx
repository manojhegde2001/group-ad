'use client';

import { useState } from 'react';
import Masonry from 'react-masonry-css';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

const DEMO_POSTS = [
  {
    id: 1,
    title: 'Modern UI Design Trends 2026',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
    author: { name: 'Sarah Johnson', avatar: '' },
    category: 'Design',
    likes: 1234,
    comments: 45,
  },
  {
    id: 2,
    title: 'Build Scalable Web Apps',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    author: { name: 'Mike Chen', avatar: '' },
    category: 'Technology',
    likes: 892,
    comments: 32,
  },
  {
    id: 3,
    title: 'Marketing Strategies That Work',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    author: { name: 'Emma Wilson', avatar: '' },
    category: 'Business',
    likes: 2156,
    comments: 78,
  },
  {
    id: 4,
    title: 'Sustainable Living Tips',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
    author: { name: 'Alex Green', avatar: '' },
    category: 'Lifestyle',
    likes: 567,
    comments: 23,
  },
  {
    id: 5,
    title: 'AI & Machine Learning Basics',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
    author: { name: 'David Kim', avatar: '' },
    category: 'Technology',
    likes: 3421,
    comments: 156,
  },
  {
    id: 6,
    title: 'Photography Composition Guide',
    image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400',
    author: { name: 'Lisa Brown', avatar: '' },
    category: 'Photography',
    likes: 789,
    comments: 34,
  },
];

export function MasonryGrid() {
  const [liked, setLiked] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);

  const toggleLike = (id: number) => {
    setLiked((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSave = (id: number) => {
    setSaved((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const breakpointColumns = {
    default: 4,
    1536: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1,
  };

  return (
    <section className="py-12 px-4 bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Trending Posts</h2>

        <Masonry
          breakpointCols={breakpointColumns}
          className="flex -ml-6 w-auto"
          columnClassName="pl-6 bg-clip-padding"
        >
          {DEMO_POSTS.map((post) => (
            <div key={post.id} className="mb-6">
              <Card variant="elevated" className="overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow">
                {/* Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleSave(post.id)}
                      className="p-2 bg-white dark:bg-secondary-800 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Bookmark
                        className={`w-5 h-5 ${
                          saved.includes(post.id)
                            ? 'fill-primary text-primary'
                            : 'text-secondary-600'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="flat" size="sm">
                      {post.category}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg mb-3 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar
                        name={post.author.name}
                        src={post.author.avatar}
                        size="sm"
                      />
                      <span className="text-sm text-secondary-600 dark:text-secondary-400">
                        {post.author.name}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className="flex items-center space-x-1 text-secondary-600 dark:text-secondary-400 hover:text-red-500 transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            liked.includes(post.id)
                              ? 'fill-red-500 text-red-500'
                              : ''
                          }`}
                        />
                        <span className="text-sm">{post.likes}</span>
                      </button>

                      <button className="flex items-center space-x-1 text-secondary-600 dark:text-secondary-400 hover:text-primary transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{post.comments}</span>
                      </button>
                    </div>

                    <button className="text-secondary-600 dark:text-secondary-400 hover:text-primary transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </Masonry>
      </div>
    </section>
  );
}
