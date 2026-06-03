import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { notificationService } from '@/services/notification-service';

const updateMeetingSchema = z.object({
    status: z.enum(['ACCEPTED', 'REJECTED', 'CANCELLED']),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { meetingId } = await params;
        const body = await request.json();
        const { status } = updateMeetingSchema.parse(body);

        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
        });

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        const userId = session.user.id;
        const isRequester = meeting.requesterId === userId;
        const isReceiver = meeting.receiverId === userId;

        if (!isRequester && !isReceiver) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Only receiver can accept or reject
        if ((status === 'ACCEPTED' || status === 'REJECTED') && !isReceiver) {
            return NextResponse.json({ error: 'Only the receiver can accept or reject a meeting' }, { status: 403 });
        }

        // Only requester can cancel
        if (status === 'CANCELLED' && !isRequester) {
            return NextResponse.json({ error: 'Only the requester can cancel a meeting' }, { status: 403 });
        }

        // Can only update a PENDING meeting
        if (meeting.status !== 'PENDING') {
            return NextResponse.json({ error: `Meeting is already ${meeting.status.toLowerCase()}` }, { status: 400 });
        }

        const updatedMeeting = await prisma.meeting.update({
            where: { id: meetingId },
            data: { status },
        });

        // Fetch receiver name for notification
        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, companyName: true },
        });
        const userName = dbUser?.companyName || dbUser?.name || 'Someone';

        // Notify the requester on accept
        if (status === 'ACCEPTED') {
            await notificationService.create({
                userId: meeting.requesterId,
                type: 'MEETING_INVITE',
                title: 'Meeting Request Accepted',
                message: `${userName} has accepted your 1:1 meeting request.`,
                entityType: 'meeting',
                entityId: meeting.id,
                senderId: userId,
            });
        }

        return NextResponse.json({ message: `Meeting ${status.toLowerCase()}`, meeting: updatedMeeting });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
    }
}
