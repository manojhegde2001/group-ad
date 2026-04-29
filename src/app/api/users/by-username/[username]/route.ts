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
                websiteLabel: true,
                userType: true,
                verificationStatus: true,
                createdAt: true,
                phone: true,
                secondaryPhone: true,
                phoneVisibility: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Record profile view for analytics
        if (user.id) {
            prisma.profileView.create({
                data: {
                    viewedId: user.id,
                    viewerId: currentUserId,
                }
            }).catch(err => console.error('Error recording profile view:', err));
        }

        // Get counts, connection status, and block status separately
        const [connectionCount, postCount, connectionRecord, blockRecord, mutualConnections] = await Promise.all([
            prisma.connection.count({ 
                where: { 
                    status: 'ACCEPTED',
                    OR: [
                        { requesterId: user.id },
                        { receiverId: user.id }
                    ]
                } 
            }),
            prisma.post.count({ where: { userId: user.id } }),
            currentUserId
                ? prisma.connection.findFirst({
                    where: {
                        OR: [
                            { requesterId: currentUserId, receiverId: user.id },
                            { requesterId: user.id, receiverId: currentUserId },
                        ],
                    },
                })
                : null,
            currentUserId
                ? prisma.block.findUnique({
                    where: {
                        blockerId_blockedId: { blockerId: currentUserId, blockedId: user.id },
                    },
                })
                : null,
            // Mutual Connections
            currentUserId && currentUserId !== user.id
                ? (async () => {
                    const [myConns, theirConns] = await Promise.all([
                        prisma.connection.findMany({
                            where: { status: 'ACCEPTED', OR: [{ requesterId: currentUserId }, { receiverId: currentUserId }] },
                            select: { requesterId: true, receiverId: true }
                        }),
                        prisma.connection.findMany({
                            where: { status: 'ACCEPTED', OR: [{ requesterId: user.id }, { receiverId: user.id }] },
                            select: { requesterId: true, receiverId: true }
                        })
                    ]);
                    const myFriends = new Set(myConns.map(c => c.requesterId === currentUserId ? c.receiverId : c.requesterId));
                    const theirFriends = theirConns.map(c => c.requesterId === user.id ? c.receiverId : c.requesterId);
                    const mutualIds = theirFriends.filter(id => myFriends.has(id));
                    
                    if (mutualIds.length === 0) return { count: 0, avatars: [] };

                    const mutualUsers = await prisma.user.findMany({
                        where: { id: { in: mutualIds } },
                        select: { avatar: true },
                        take: 3
                    });

                    return {
                        count: mutualIds.length,
                        avatars: mutualUsers.map(u => u.avatar).filter(Boolean) as string[]
                    };
                })()
                : Promise.resolve({ count: 0, avatars: [] as string[] }),
        ]);



        let hasSharedAttendance = false;
        if (currentUserId && currentUserId !== user.id) {
            const sharedEvent = await prisma.eventEnrollment.findFirst({
                where: {
                    userId: currentUserId,
                    attended: true,
                    event: { enrollments: { some: { userId: user.id, attended: true } } }
                }
            });
            hasSharedAttendance = !!sharedEvent;
        }

        const isConnected = connectionRecord?.status === 'ACCEPTED';
        const isSelf = currentUserId === user.id;
        const canViewPhoneAtAll = isSelf || (isConnected && hasSharedAttendance);

        // Strip phone if not allowed based on global criteria AND user preferences
        const userData = { ...user };
        
        if (!isSelf) {
            if (!canViewPhoneAtAll || user.phoneVisibility === 'NONE') {
                userData.phone = null;
                userData.secondaryPhone = null;
            } else if (user.phoneVisibility === 'PRIMARY') {
                userData.secondaryPhone = null;
            } else if (user.phoneVisibility === 'SECONDARY') {
                userData.phone = null;
            }
            // If user.phoneVisibility === 'BOTH', we keep both
        }

        return NextResponse.json({
            user: {
                ...userData,
                connectionStatus: (connectionRecord?.status === 'REJECTED') ? null : (connectionRecord?.status || null),
                connectionInitiator: connectionRecord?.requesterId === currentUserId,
                isBlocked: !!blockRecord,
                _count: {
                    posts: postCount,
                    connections: connectionCount,
                },
                mutualConnections: mutualConnections,
            },
        });
    } catch (error) {
        console.error('Error fetching user profile by username:', error);
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }
}
