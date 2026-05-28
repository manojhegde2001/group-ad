import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatEventDate } from '@/lib/event-utils';
import { sendMail, enrollmentConfirmationEmail, enrollmentApprovalEmail, getAppBaseUrl } from '@/lib/mailer';
import { socketService } from '@/lib/socket-service';
import { logger } from '@/lib/logger';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let idOrSlug = '';
    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Enrollment rejected: unauthenticated request');
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const resolvedParams = await params;
        idOrSlug = resolvedParams.id;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

        const event = await prisma.event.findFirst({
            where: {
                OR: [
                    ...(isObjectId ? [{ id: idOrSlug }] : []),
                    { slug: idOrSlug },
                ],
            },
            include: { organizer: { select: { id: true } } },
        });

        if (!event || event.status !== 'PUBLISHED') {
            logger.warn('Enrollment rejected: event not found or not published', { idOrSlug });
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const eventId = event.id;

        // Check if already enrolled
        const existing = await prisma.eventEnrollment.findUnique({
            where: { eventId_userId: { eventId, userId: session.user.id } },
        });

        if (existing) {
            logger.warn('Enrollment rejected: already enrolled', { eventId, userId: session.user.id });
            return NextResponse.json({ error: 'Already enrolled' }, { status: 409 });
        }

        // Check targeted restrictions
        if (event.targetUserTypes && event.targetUserTypes.length > 0) {
            const userDb = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { userType: true }
            });
            if (userDb && !event.targetUserTypes.includes(userDb.userType)) {
                logger.warn('Enrollment rejected: userType target mismatch', {
                    eventId,
                    userId: session.user.id,
                    userType: userDb.userType,
                    allowed: event.targetUserTypes
                });
                return NextResponse.json({
                    error: `This event is restricted. It is only open to: ${event.targetUserTypes.join(', ')}`
                }, { status: 403 });
            }
        }

        if (event.targetCategoryIds && event.targetCategoryIds.length > 0) {
            const userDb = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { categoryId: true }
            });
            if (userDb && (!userDb.categoryId || !event.targetCategoryIds.includes(userDb.categoryId))) {
                logger.warn('Enrollment rejected: professional category restriction', {
                    eventId,
                    userId: session.user.id,
                    categoryId: userDb.categoryId,
                    allowed: event.targetCategoryIds
                });
                return NextResponse.json({
                    error: `This event is restricted to specific professional categories.`
                }, { status: 403 });
            }
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
                        logger.warn('Enrollment rejected: category-specific spot limit reached', {
                            eventId,
                            userId: session.user.id,
                            categoryId: userCategoryId,
                            limit: limitEntry.limit,
                            currentCount: categoryEnrollmentCount
                        });
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

        const baseUrl = getAppBaseUrl(request);

        const enrollmentStatus = isFull ? 'PENDING' : 'APPROVED';

        const enrollment = await prisma.eventEnrollment.create({
            data: {
                eventId,
                userId: session.user.id,
                status: enrollmentStatus,
                approvedAt: enrollmentStatus === 'APPROVED' ? new Date() : null,
            },
        });

        if (enrollmentStatus === 'APPROVED') {
            await prisma.event.update({
                where: { id: eventId },
                data: { currentAttendees: { increment: 1 } },
            });
        }

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
            admins.forEach((admin) => {
                socketService.notifyUser(admin.id, {
                    type: 'EVENT_ENROLLMENT',
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
        socketService.notifyUser(session.user.id, {
            type: 'EVENT_ENROLLMENT',
            message: userNotification.message,
            data: { notificationId: userNotification.id, eventId }
        });

        // Email confirmation to user (fire-and-forget)
        if (user?.email) {
            sendMail({
                to: user.email,
                subject: `[Vrutta] Enrollment received: ${event.title}`,
                html: enrollmentConfirmationEmail(event.title, formatEventDate(event.startDate, event.endDate), baseUrl),
            }).catch(mailErr => {
                logger.error('Failed to send enrollment email notification', mailErr, { eventId, userId: session.user.id });
            });
        }

        logger.info(isFull ? 'User added to waitlist successfully' : 'User enrolled successfully', {
            eventId,
            userId: session.user.id,
            status: enrollmentStatus,
            enrollmentId: enrollment.id
        });

        return NextResponse.json(
            {
                message: isFull ? 'Added to waitlist' : 'Enrolled successfully',
                enrollment,
                waitlisted: isFull,
            },
            { status: 201 }
        );
    } catch (error) {
        logger.error('Error enrolling user in event', error, { idOrSlug });
        return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let idOrSlug = '';
    try {
        const session = await auth();
        if (!session?.user?.id) {
            logger.warn('Enrollment withdrawal rejected: unauthenticated request');
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const resolvedParams = await params;
        idOrSlug = resolvedParams.id;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
        const baseUrl = getAppBaseUrl(request);

        const enrollment = await prisma.eventEnrollment.findFirst({
            where: {
                userId: session.user.id,
                event: {
                    OR: [
                        ...(isObjectId ? [{ id: idOrSlug }] : []),
                        { slug: idOrSlug },
                    ],
                }
            },
            include: { event: { select: { id: true, title: true, organizerId: true, startDate: true, endDate: true, meetingLink: true } } }
        });

        if (!enrollment) {
            logger.warn('Enrollment withdrawal rejected: enrollment record not found', { idOrSlug, userId: session.user.id });
            return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
        }

        const eventId = enrollment.event.id;

        // Waitlist promotion logic: if the user who is withdrawing was approved, promote the next waitlisted user
        let promotedUser = null;
        if (enrollment.status === 'APPROVED') {
            const nextInLine = await prisma.eventEnrollment.findFirst({
                where: { eventId, status: 'PENDING' },
                orderBy: { createdAt: 'asc' },
                include: { user: { select: { id: true, name: true, email: true } } }
            });

            if (nextInLine) {
                // Promote waitlisted attendee to APPROVED
                await prisma.eventEnrollment.update({
                    where: { id: nextInLine.id },
                    data: {
                        status: 'APPROVED',
                        approvedAt: new Date(),
                        approvedBy: session.user.id
                    }
                });

                promotedUser = nextInLine;

                // Notify promoted user in-app
                await prisma.notification.create({
                    data: {
                        userId: nextInLine.userId,
                        type: 'EVENT_APPROVED' as any,
                        title: 'Spot Reserved from Waitlist!',
                        message: `Congratulations! A spot opened up, and you have been promoted from the waitlist for "${enrollment.event.title}".`,
                        entityType: 'event',
                        entityId: eventId,
                    }
                });

                // Emit real-time notification
                socketService.notifyUser(nextInLine.userId, {
                    type: 'EVENT_APPROVED',
                    message: `Congratulations! A spot opened up, and you have been promoted from the waitlist for "${enrollment.event.title}".`,
                    data: { eventId }
                });

                // Email confirmation to promoted user
                if (nextInLine.user.email) {
                    sendMail({
                        to: nextInLine.user.email,
                        subject: `[Vrutta] Spot Secured: ${enrollment.event.title}`,
                        html: enrollmentApprovalEmail(
                            enrollment.event.title,
                            formatEventDate(enrollment.event.startDate || new Date(), enrollment.event.endDate || new Date()),
                            enrollment.event.meetingLink || '',
                            baseUrl
                        ),
                    }).catch(mailErr => {
                        logger.error('Failed to send waitlist promotion email notification', mailErr, { eventId, userId: nextInLine.userId });
                    });
                }

                logger.info('Waitlist promotion triggered during withdrawal', {
                    eventId,
                    withdrawnUserId: session.user.id,
                    promotedUserId: nextInLine.userId,
                    promotedEnrollmentId: nextInLine.id
                });
            } else {
                // No waitlist: Decrement attendee count
                await prisma.event.update({
                    where: { id: eventId },
                    data: { currentAttendees: { decrement: 1 } },
                });
            }
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
            admins.forEach((admin) => {
                socketService.notifyUser(admin.id, {
                    type: 'EVENT_ENROLLMENT',
                    message: `${user?.name || 'A user'} has withdrawn from "${enrollment.event.title}"`,
                    data: { eventId, senderId: session.user!.id }
                });
            });
        }

        logger.info('User withdrew from event successfully', {
            eventId,
            userId: session.user.id,
            enrollmentId: enrollment.id
        });

        return NextResponse.json({ message: 'Enrollment cancelled' });
    } catch (error) {
        logger.error('Error cancelling/withdrawing enrollment', error, { idOrSlug });
        return NextResponse.json({ error: 'Failed to cancel enrollment' }, { status: 500 });
    }
}
