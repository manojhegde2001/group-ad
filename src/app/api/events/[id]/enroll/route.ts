import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatEventDate } from '@/lib/event-utils';
import { sendMail, enrollmentConfirmationEmail } from '@/lib/mailer';
import { firebaseService } from '@/lib/firebase-service';

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

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { organizer: { select: { id: true } } },
        });

        if (!event || event.status !== 'PUBLISHED') {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Check if already enrolled
        const existing = await prisma.eventEnrollment.findUnique({
            where: { eventId_userId: { eventId, userId: session.user.id } },
        });

        if (existing) {
            return NextResponse.json({ error: 'Already enrolled' }, { status: 409 });
        }

        // Check overall capacity
        const isFull = event.maxAttendees !== null && event.currentAttendees >= event.maxAttendees;

        // ── Category-based quota check ───────────────────────────────────────
        const categoryLimits = (event as any).categoryLimits as Array<{ categoryId: string; categoryName: string; limit: number }> | null;
        if (categoryLimits && categoryLimits.length > 0) {
            // Get the enrolling user's category
            const enrollingUser = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { categoryId: true, category: { select: { name: true } } },
            });

            const userCategoryId = enrollingUser?.categoryId;

            if (userCategoryId) {
                const limitEntry = categoryLimits.find((cl) => cl.categoryId === userCategoryId);
                if (limitEntry) {
                    // Count current approved+pending enrollments from this category
                    const categoryEnrollmentCount = await prisma.eventEnrollment.count({
                        where: {
                            eventId,
                            status: { in: ['APPROVED', 'PENDING'] },
                            user: { categoryId: userCategoryId },
                        },
                    });

                    if (categoryEnrollmentCount >= limitEntry.limit) {
                        return NextResponse.json(
                            {
                                error: `The spot limit for "${limitEntry.categoryName}" participants has been reached for this event.`,
                                categoryFull: true,
                            },
                            { status: 422 }
                        );
                    }
                }
            }
        }

        const enrollment = await prisma.eventEnrollment.create({
            data: {
                eventId,
                userId: session.user.id,
                status: 'PENDING',
            },
        });

        // In-app notification to admin about new enrollment
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true, name: true },
        });

        // Notify admin(s)
        const admins = await prisma.user.findMany({
            where: { userType: 'ADMIN' },
            select: { id: true },
        });

        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map((admin) => ({
                    userId: admin.id,
                    type: 'EVENT_ENROLLMENT' as any,
                    title: 'New Event Enrollment',
                    message: `${user?.name || 'A user'} enrolled in "${event.title}"`,
                    entityType: 'event',
                    entityId: eventId,
                    senderId: session.user!.id,
                })),
            });

            // Emit real-time notification to admins
            admins.forEach(async (admin) => {
                await firebaseService.notifyUser(admin.id, {
                    type: 'EVENT_ENROLLMENT',
                    title: 'New Event Enrollment',
                    message: `${user?.name || 'A user'} enrolled in "${event.title}"`,
                    data: { eventId, senderId: session.user!.id }
                });
            });
        }

        // Notify user
        const userNotification = await prisma.notification.create({
            data: {
                userId: session.user.id,
                type: 'EVENT_ENROLLMENT' as any,
                title: 'Enrollment Received',
                message: `You have successfully enrolled in "${event.title}". We will keep you updated.`,
                entityType: 'event',
                entityId: eventId,
            }
        });

        // Emit real-time notification to user
        await firebaseService.notifyUser(session.user.id, {
            type: 'EVENT_ENROLLMENT',
            title: 'Enrollment Received',
            message: userNotification.message,
            data: { notificationId: userNotification.id, eventId }
        });

        // Email confirmation to user (fire-and-forget)
        if (user?.email) {
            sendMail({
                to: user.email,
                subject: `Enrollment received: ${event.title}`,
                html: enrollmentConfirmationEmail(event.title, formatEventDate(event.startDate, event.endDate)),
            });
        }

        return NextResponse.json(
            {
                message: isFull ? 'Added to waitlist' : 'Enrolled successfully',
                enrollment,
                waitlisted: isFull,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error enrolling:', error);
        return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id: eventId } = await params;

        const enrollment = await prisma.eventEnrollment.findUnique({
            where: { eventId_userId: { eventId, userId: session.user.id } },
            include: { event: { select: { title: true, organizerId: true } } }
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
        }

        // Decrement attendee count if was approved
        if (enrollment.status === 'APPROVED') {
            await prisma.event.update({
                where: { id: eventId },
                data: { currentAttendees: { decrement: 1 } },
            });
        }

        await prisma.eventEnrollment.delete({
            where: { id: enrollment.id },
        });

        // Notify user about cancellation
        await prisma.notification.create({
            data: {
                userId: session.user.id,
                type: 'EVENT_ENROLLMENT' as any,
                title: 'Enrollment Cancelled',
                message: `You have successfully withdrawn from "${enrollment.event.title}".`,
                entityType: 'event',
                entityId: eventId,
            }
        });

        // Notify admin(s)
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true },
        });

        const admins = await prisma.user.findMany({
            where: { userType: 'ADMIN' },
            select: { id: true },
        });

        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map((admin) => ({
                    userId: admin.id,
                    type: 'EVENT_ENROLLMENT' as any,
                    title: 'Event Withdrawal',
                    message: `${user?.name || 'A user'} has withdrawn from "${enrollment.event.title}"`,
                    entityType: 'event',
                    entityId: eventId,
                    senderId: session.user!.id,
                })),
            });

            // Emit real-time notification to admins
            admins.forEach(async (admin) => {
                await firebaseService.notifyUser(admin.id, {
                    type: 'EVENT_ENROLLMENT',
                    title: 'Event Withdrawal',
                    message: `${user?.name || 'A user'} has withdrawn from "${enrollment.event.title}"`,
                    data: { eventId, senderId: session.user!.id }
                });
            });
        }

        return NextResponse.json({ message: 'Enrollment cancelled' });
    } catch (error) {
        console.error('Error cancelling enrollment:', error);
        return NextResponse.json({ error: 'Failed to cancel enrollment' }, { status: 500 });
    }
}
