import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const enrollments = await prisma.eventEnrollment.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                event: {
                    include: {
                        category: { select: { id: true, name: true, slug: true, icon: true } },
                        organizer: { select: { id: true, name: true, username: true, avatar: true } },
                        _count: { select: { enrollments: true } },
                    },
                },
            },
        });

        return NextResponse.json({ enrollments });
    } catch (error) {
        console.error('Error fetching my events:', error);
        return NextResponse.json({ error: 'Failed to fetch your events' }, { status: 500 });
    }
}
