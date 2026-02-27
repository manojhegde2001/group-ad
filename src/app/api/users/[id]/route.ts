import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const db = prisma as any; // Follow/Bookmark models available at runtime after prisma generate

// GET /api/users/[id] — Public user profile by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const currentUserId = session?.user?.id ?? null;
        const { id: userId } = await params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                bio: true,
                location: true,
                website: true,
                userType: true,
                verificationStatus: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const [followerCount, followingCount, postCount, followRecord] = await Promise.all([
            db.follow.count({ where: { followingId: user.id } }),
            db.follow.count({ where: { followerId: user.id } }),
            prisma.post.count({ where: { userId: user.id } }),
            currentUserId
                ? db.follow.findUnique({
                    where: {
                        followerId_followingId: {
                            followerId: currentUserId,
                            followingId: user.id,
                        },
                    },
                })
                : null,
        ]);

        return NextResponse.json({
            user: {
                ...user,
                isFollowing: !!followRecord,
                _count: {
                    posts: postCount,
                    followers: followerCount,
                    following: followingCount,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }
}
