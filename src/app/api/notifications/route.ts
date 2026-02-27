import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications — Get paginated notifications + unread count
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: { userId: session.user.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.notification.count({ where: { userId: session.user.id } }),
            prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
        ]);

        // Enrich notifications with sender info
        const senderIds = notifications
            .map((n) => n.senderId)
            .filter((id): id is string => !!id);

        const senders = senderIds.length
            ? await prisma.user.findMany({
                where: { id: { in: senderIds } },
                select: { id: true, name: true, username: true, avatar: true },
            })
            : [];

        const senderMap = Object.fromEntries(senders.map((s) => [s.id, s]));

        const enriched = notifications.map((n) => ({
            ...n,
            sender: n.senderId ? senderMap[n.senderId] ?? null : null,
        }));

        return NextResponse.json({
            notifications: enriched,
            unreadCount,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}
