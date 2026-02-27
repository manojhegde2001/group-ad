'use client';

import { useState, useCallback } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
    userId: string;
    initialFollowing: boolean;
    initialFollowerCount: number;
    size?: 'sm' | 'md';
    onFollowChange?: (isFollowing: boolean, followerCount: number) => void;
}

export function FollowButton({
    userId,
    initialFollowing,
    initialFollowerCount,
    size = 'md',
    onFollowChange,
}: FollowButtonProps) {
    const { user, isAuthenticated } = useAuth();
    const { openLogin } = useAuthModal();
    const [isFollowing, setIsFollowing] = useState(initialFollowing);
    const [followerCount, setFollowerCount] = useState(initialFollowerCount);
    const [loading, setLoading] = useState(false);

    // Don't render if viewing own profile
    if (isAuthenticated && user?.id === userId) return null;

    const toggle = useCallback(async () => {
        if (!isAuthenticated) {
            openLogin();
            return;
        }
        if (loading) return;

        const prevFollowing = isFollowing;
        const prevCount = followerCount;

        // Optimistic update
        const newFollowing = !prevFollowing;
        const newCount = newFollowing ? prevCount + 1 : Math.max(0, prevCount - 1);
        setIsFollowing(newFollowing);
        setFollowerCount(newCount);
        setLoading(true);

        try {
            const res = await fetch(`/api/users/${userId}/follow`, {
                method: newFollowing ? 'POST' : 'DELETE',
            });
            if (!res.ok) {
                setIsFollowing(prevFollowing);
                setFollowerCount(prevCount);
            } else {
                const data = await res.json();
                setFollowerCount(data.followerCount ?? newCount);
                onFollowChange?.(newFollowing, data.followerCount ?? newCount);
            }
        } catch {
            setIsFollowing(prevFollowing);
            setFollowerCount(prevCount);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isFollowing, followerCount, loading, openLogin, userId, onFollowChange]);

    return (
        <Button
            onClick={toggle}
            disabled={loading}
            variant={isFollowing ? 'outline' : 'solid'}
            color={isFollowing ? 'secondary' : 'primary'}
            size={size}
            rounded="pill"
            leftIcon={
                loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                    <UserMinus className="w-4 h-4" />
                ) : (
                    <UserPlus className="w-4 h-4" />
                )
            }
            className="transition-all duration-200"
        >
            {isFollowing ? 'Following' : 'Follow'}
        </Button>
    );
}
