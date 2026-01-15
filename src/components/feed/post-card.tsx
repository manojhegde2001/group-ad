'use client';

import { Avatar, Text, Badge } from 'rizzui';
import { Heart, Share2, Eye } from 'lucide-react';
import type { Post } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import Image from 'next/image';

interface PostCardProps {
    post: Post;
}

export function PostCard({ post }: PostCardProps) {
    const { isAuthenticated } = useAuth();
    const { openLogin } = useAuthModal();

    const handleAction = () => {
        if (!isAuthenticated) {
            openLogin();
        }
    };

    return (
        <div className="mb-6 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
            {post.type === 'IMAGE' && post.images.length > 0 && (
                <div className="relative w-full aspect-[3/4] bg-secondary-100 dark:bg-secondary-800">
                    <Image
                        src={post.images[0]}
                        alt={post.content}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
            )}

            <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                    <Avatar
                        src={post.author.avatar}
                        name={post.author.name}
                        size="sm"
                    />
                    <div className="flex-1 min-w-0">
                        <Text className="font-semibold truncate">{post.author.name}</Text>
                        <Text className="text-xs text-secondary-600 dark:text-secondary-400">
                            @{post.author.username}
                        </Text>
                    </div>
                </div>

                <Text className="text-sm mb-3 line-clamp-3">{post.content}</Text>

                <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" size="sm">{post.category}</Badge>
                    {post.tags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="flat" size="sm" color="secondary">
                            #{tag}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center gap-4 text-secondary-600 dark:text-secondary-400">
                    <button
                        onClick={handleAction}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    >
                        <Heart className="w-4 h-4" />
                        <Text className="text-xs">{post.likes}</Text>
                    </button>

                    <button
                        onClick={handleAction}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        <Text className="text-xs">{post.shares}</Text>
                    </button>

                    <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <Text className="text-xs">{post.views}</Text>
                    </div>
                </div>
            </div>
        </div>
    );
}
