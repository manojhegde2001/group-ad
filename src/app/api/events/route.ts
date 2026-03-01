import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/event-utils';
import { z } from 'zod';

const createEventSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10),
    eventType: z.string().default('MEETUP'),
    categoryId: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    timezone: z.string().default('Asia/Kolkata'),
    isOnline: z.boolean().default(false),
    venue: z.string().optional(),
    meetingLink: z.string().url().optional().or(z.literal('')),
    maxAttendees: z.number().int().positive().optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
    targetUserTypes: z.array(z.string()).default([]),
    targetCategoryIds: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    images: z.array(z.string()).default([]),
    status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const skip = (page - 1) * limit;
        const categoryId = searchParams.get('categoryId');
        const search = searchParams.get('search');
        const upcoming = searchParams.get('upcoming') === 'true';
        const all = searchParams.get('all') === 'true'; // admin: show all statuses

        const isAdmin = (session?.user as any)?.userType === 'ADMIN';

        const where: any = {};

        if (all && isAdmin) {
            // admin can see all status
        } else {
            where.status = 'PUBLISHED';
        }

        if (upcoming) {
            where.startDate = { gte: new Date() };
        }

        if (categoryId) where.categoryId = categoryId;

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                skip,
                take: limit,
                orderBy: { startDate: 'asc' },
                include: {
                    category: { select: { id: true, name: true, slug: true, icon: true } },
                    organizer: { select: { id: true, name: true, username: true, avatar: true } },
                    _count: { select: { enrollments: true } },
                },
            }),
            prisma.event.count({ where }),
        ]);

        return NextResponse.json({
            events,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, userType: true },
        });

        if (!dbUser || dbUser.userType !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const data = createEventSchema.parse(body);

        const slug = slugify(data.title);

        const event = await prisma.event.create({
            data: {
                title: data.title,
                slug,
                description: data.description,
                eventType: data.eventType,
                categoryId: data.categoryId || null,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                timezone: data.timezone,
                isOnline: data.isOnline,
                venue: data.venue || null,
                meetingLink: data.meetingLink || null,
                maxAttendees: data.maxAttendees || null,
                visibility: data.visibility,
                targetUserTypes: data.targetUserTypes,
                targetCategoryIds: data.targetCategoryIds,
                coverImage: data.coverImage || null,
                images: data.images,
                status: data.status,
                organizerId: dbUser.id,
            },
            include: {
                category: { select: { id: true, name: true, slug: true, icon: true } },
                organizer: { select: { id: true, name: true, username: true, avatar: true } },
            },
        });

        return NextResponse.json({ message: 'Event created', event }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating event:', error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
