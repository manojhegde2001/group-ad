import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
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

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, title: true, endDate: true },
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const enrollments = await prisma.eventEnrollment.findMany({
            where: { eventId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: {
                        id: true, name: true, username: true, avatar: true,
                        email: true, userType: true, industry: true, companyName: true,
                    },
                },
            },
        });

        return NextResponse.json({ event, enrollments });
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }
}
