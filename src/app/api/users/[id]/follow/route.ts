import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const db = prisma as any; // new models (Follow, Bookmark) available at runtime after prisma generate

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/users/[id]/follow — Get follow status + counts
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        const currentUserId = session?.user?.id ?? null;
        const { id: targetUserId } = await params;

        const [followerCount, followingCount, followRecord] = await Promise.all([
            db.follow.count({ where: { followingId: targetUserId } }),
            db.follow.count({ where: { followerId: targetUserId } }),
            currentUserId
                ? db.follow.findUnique({
                    where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
                })
                : null,
        ]);

        return NextResponse.json({
            isFollowing: !!followRecord,
            followerCount,
            followingCount,
        });
    } catch (error) {
        console.error('Error getting follow status:', error);
        return NextResponse.json({ error: 'Failed to get follow status' }, { status: 500 });
    }
}

// POST /api/users/[id]/follow — Follow a user
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id: targetUserId } = await params;

        if (targetUserId === session.user.id) {
            return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, name: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await db.follow.upsert({
            where: {
                followerId_followingId: {
                    followerId: session.user.id,
                    followingId: targetUserId,
                },
            },
            create: {
                followerId: session.user.id,
                followingId: targetUserId,
            },
            update: {},
        });

        // Create notification for the followed user
        const followerUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, username: true },
        });

        await prisma.notification.create({
            data: {
                userId: targetUserId,
                type: 'CONNECTION_REQUEST',
                title: 'New Follower',
                message: `${followerUser?.name || 'Someone'} started following you`,
                senderId: session.user.id,
                entityType: 'user',
                entityId: session.user.id,
            },
        });

        const followerCount = await db.follow.count({ where: { followingId: targetUserId } });

        return NextResponse.json({
            message: 'Followed successfully',
            isFollowing: true,
            followerCount,
        });
    } catch (error) {
        console.error('Error following user:', error);
        return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
    }
}

// DELETE /api/users/[id]/follow — Unfollow a user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id: targetUserId } = await params;

        await db.follow.deleteMany({
            where: {
                followerId: session.user.id,
                followingId: targetUserId,
            },
        });

        const followerCount = await db.follow.count({ where: { followingId: targetUserId } });

        return NextResponse.json({
            message: 'Unfollowed successfully',
            isFollowing: false,
            followerCount,
        });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
    }
}
