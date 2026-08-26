import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatEventDate } from '@/lib/event-utils';
import { sendMail, enrollmentApprovalEmail, getAppBaseUrl } from '@/lib/mailer';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const schema = z.object({
    action: z.enum(['APPROVE', 'REJECT']),
    adminNote: z.string().optional(),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
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

        const { id: eventId, userId } = await params;
        const body = await request.json();
        const { action, adminNote } = schema.parse(body);

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, title: true, startDate: true, endDate: true, meetingLink: true, maxAttendees: true, currentAttendees: true, organizerId: true },
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const isOrganizer = event.organizerId === session.user.id;
        const isAdmin = dbUser?.userType === 'ADMIN';

        if (!isOrganizer && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized: Organizer or Admin access required' }, { status: 403 });
        }

        const enrollment = await prisma.eventEnrollment.findUnique({
            where: { eventId_userId: { eventId, userId } },
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
        }

        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

        // If approving, check capacity
        if (action === 'APPROVE' && event.maxAttendees !== null && event.currentAttendees >= event.maxAttendees) {
            return NextResponse.json({ error: 'Event is at full capacity' }, { status: 409 });
        }

        const [updatedEnrollment] = await prisma.$transaction([
            prisma.eventEnrollment.update({
                where: { id: enrollment.id },
                data: {
                    status: newStatus,
                    approvedAt: action === 'APPROVE' ? new Date() : null,
                    approvedBy: action === 'APPROVE' ? session.user.id : null,
                    adminNote: adminNote || null,
                },
            }),
            ...(action === 'APPROVE'
                ? [prisma.event.update({ where: { id: eventId }, data: { currentAttendees: { increment: 1 } } })]
                : []),
        ]);

        // In-app notification to user
        const notifType = action === 'APPROVE' ? 'EVENT_APPROVED' : 'EVENT_ENROLLMENT';
        const notifTitle = action === 'APPROVE' ? 'Enrollment Approved!' : 'Enrollment Update';
        const notifMessage = action === 'APPROVE'
            ? `Your enrollment for "${event.title}" has been approved.`
            : `Your enrollment for "${event.title}" was not approved.`;

        await prisma.notification.create({
            data: {
                userId,
                type: notifType as any,
                title: notifTitle,
                message: notifMessage,
                entityType: 'event',
                entityId: eventId,
                senderId: session.user.id,
            },
        });

        // Email to user on approval
        if (action === 'APPROVE') {
            const baseUrl = getAppBaseUrl(request);
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
            if (user?.email) {
                sendMail({
                    to: user.email,
                    subject: `[Vrutta] Enrollment Approved: ${event.title}`,
                    html: enrollmentApprovalEmail(
                        event.title,
                        formatEventDate(event.startDate, event.endDate),
                        event.meetingLink,
                        baseUrl
                    ),
                });
            }
        }

        return NextResponse.json({ message: `Enrollment ${action.toLowerCase()}d`, enrollment: updatedEnrollment });
    } catch (error: any) {
        logger.error('Error updating enrollment', error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Invalid action', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 });
    }
}
