import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/notifications/read-all — Mark all notifications as read
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        await prisma.notification.updateMany({
            where: { userId: session.user.id, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });

        return NextResponse.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all read:', error);
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
    }
}
