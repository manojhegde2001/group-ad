import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateEventSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).optional(),
    eventType: z.string().optional(),
    categoryId: z.string().optional().nullable(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    timezone: z.string().optional(),
    isOnline: z.boolean().optional(),
    venue: z.string().optional().nullable(),
    meetingLink: z.string().optional().nullable(),
    maxAttendees: z.number().int().positive().optional().nullable(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
    targetUserTypes: z.array(z.string()).optional(),
    targetCategoryIds: z.array(z.string()).optional(),
    coverImage: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                category: { select: { id: true, name: true, slug: true, icon: true } },
                organizer: { select: { id: true, name: true, username: true, avatar: true, userType: true } },
                company: { select: { id: true, name: true, logo: true } },
                _count: { select: { enrollments: true } },
            },
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Non-admins can only see published events
        const isAdmin = (session?.user as any)?.userType === 'ADMIN';
        if (event.status !== 'PUBLISHED' && !isAdmin) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // If user is logged in, check their enrollment status
        let userEnrollment = null;
        if (session?.user?.id) {
            userEnrollment = await prisma.eventEnrollment.findUnique({
                where: { eventId_userId: { eventId: id, userId: session.user.id } },
                select: { id: true, status: true, createdAt: true },
            });
        }

        return NextResponse.json({ event, userEnrollment });
    } catch (error) {
        console.error('Error fetching event:', error);
        return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }
}

export async function PATCH(
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

        const { id } = await params;
        const body = await request.json();
        const data = updateEventSchema.parse(body);

        const updateData: any = { ...data };
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);

        const event = await prisma.event.update({
            where: { id },
            data: updateData,
            include: {
                category: { select: { id: true, name: true, slug: true, icon: true } },
                organizer: { select: { id: true, name: true, username: true, avatar: true } },
                _count: { select: { enrollments: true } },
            },
        });

        return NextResponse.json({ message: 'Event updated', event });
    } catch (error: any) {
        console.error('Error updating event:', error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
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

        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { userType: true },
        });

        if (!dbUser || dbUser.userType !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { id } = await params;

        // Soft delete — set to CANCELLED
        await prisma.event.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });

        return NextResponse.json({ message: 'Event cancelled' });
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
