import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { socketService } from '@/lib/socket-service';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id: eventId } = await params;
        const { userIds } = await request.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'Invalid or empty user IDs list' }, { status: 400 });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, title: true }
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const inviter = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true }
        });

        const notificationsData = userIds.map(targetUserId => ({
            userId: targetUserId,
            type: 'MEETING_INVITE' as any,
            title: 'Event Invitation',
            message: `${inviter?.name || 'A user'} has invited you to join the event: "${event.title}"`,
            entityType: 'event',
            entityId: eventId,
            senderId: session.user!.id,
        }));

        await prisma.notification.createMany({
            data: notificationsData
        });

        // Trigger real-time notifications
        userIds.forEach(targetUserId => {
            socketService.notifyUser(targetUserId, {
                type: 'MEETING_INVITE',
                message: `${inviter?.name || 'A user'} has invited you to join the event: "${event.title}"`,
                data: { eventId, senderId: session.user!.id }
            });
        });

        return NextResponse.json({ success: true, message: `Invitations sent to ${userIds.length} users` });
    } catch (error) {
        console.error('Error sending invitations:', error);
        return NextResponse.json({ error: 'Failed to send invitations' }, { status: 500 });
    }
}
