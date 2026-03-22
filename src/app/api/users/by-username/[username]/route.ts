import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/by-username/[username] — Get public user profile by username
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const session = await auth();
        const currentUserId = session?.user?.id ?? null;
        const { username } = await params;

        const prismaAny = prisma as any;

        const user = await prisma.user.findUnique({
            where: { username },
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
                phone: true, // Fetch phone but conditionally return it
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get counts and follow status separately to avoid TS errors with new models
        const [followerCount, followingCount, postCount, followRecord, reverseFollowRecord] = await Promise.all([
            prismaAny.follow.count({ where: { followingId: user.id } }),
            prismaAny.follow.count({ where: { followerId: user.id } }),
            prisma.post.count({ where: { userId: user.id } }),
            currentUserId
                ? prismaAny.follow.findUnique({
                    where: {
                        followerId_followingId: { followerId: currentUserId, followingId: user.id },
                    },
                })
                : null,
            currentUserId
                ? prismaAny.follow.findUnique({
                    where: {
                        followerId_followingId: { followerId: user.id, followingId: currentUserId },
                    },
                })
                : null,
        ]);

        let hasSharedAttendance = false;
        if (currentUserId && currentUserId !== user.id) {
            // Check if both users attended the same event
            const sharedEvent = await prisma.eventEnrollment.findFirst({
                where: {
                    userId: currentUserId,
                    attended: true,
                    event: {
                        enrollments: {
                            some: {
                                userId: user.id,
                                attended: true
                            }
                        }
                    }
                }
            });
            hasSharedAttendance = !!sharedEvent;
        }

        const isMutualFollow = !!followRecord && !!reverseFollowRecord;
        const canViewPhone = currentUserId === user.id || (isMutualFollow && hasSharedAttendance);

        // Strip phone if not allowed
        const userData = { ...user };
        if (!canViewPhone) {
            userData.phone = null;
        }

        return NextResponse.json({
            user: {
                ...userData,
                isFollowing: !!followRecord,
                _count: {
                    posts: postCount,
                    followers: followerCount,
                    following: followingCount,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching user profile by username:', error);
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }
}
