import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const attendanceSchema = z.object({
    attendedUserIds: z.array(z.string()),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { userType: true },
        });

        if (!dbUser || dbUser.userType !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { id: eventId } = await params;
        const body = await request.json();
        const { attendedUserIds } = attendanceSchema.parse(body);

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, title: true, organizerId: true },
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Fetch current enrollments to see who is newly attended
        const currentEnrollments = await prisma.eventEnrollment.findMany({
            where: { eventId, status: 'APPROVED' },
            select: { userId: true, attended: true },
        });

        const newlyAttendedUsers = attendedUserIds.filter(userId => {
            const enrollment = currentEnrollments.find(e => e.userId === userId);
            return enrollment && !enrollment.attended;
        });

        // 1. Reset all attendance for this event
        await prisma.eventEnrollment.updateMany({
            where: { eventId },
            data: { attended: false, attendedAt: null },
        });

        // 2. Mark selected as attended
        if (attendedUserIds.length > 0) {
            await prisma.eventEnrollment.updateMany({
                where: { 
                    eventId, 
                    userId: { in: attendedUserIds },
                    status: 'APPROVED'
                },
                data: { attended: true, attendedAt: new Date() },
            });
        }

        // 3. Send notifications to newly attended users
        if (newlyAttendedUsers.length > 0) {
            const notifications = newlyAttendedUsers.map(userId => ({
                userId,
                actorId: session.user.id,
                type: 'MEETING_INVITE' as const, // reusing for event notifications
                title: `You attended ${event.title}!`,
                message: 'Connect with fellow attendees to grow your network.',
                entityType: 'event',
                entityId: eventId,
                read: false,
            }));

            await prisma.notification.createMany({
                data: notifications,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving attendance:', error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
    }
}
