import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const bulkRegisterSchema = z.object({
  participants: z.array(z.object({
    email: z.string().email().optional(),
    username: z.string().optional(),
  })).min(1, 'Empty list provided')
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { participants } = bulkRegisterSchema.parse(body);

    const event = await prisma.event.findUnique({
      where: { id },
      include: { enrollments: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let successCount = 0;
    let failedList: string[] = [];

    // We can optimize by fetching all users in one query
    const identifiers = participants.map(p => p.email || p.username).filter(Boolean) as string[];
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: identifiers } },
          { username: { in: identifiers } }
        ]
      }
    });

    const userMap = new Map();
    users.forEach(u => {
      if (u.email) userMap.set(u.email.toLowerCase(), u.id);
      if (u.username) userMap.set(u.username.toLowerCase(), u.id);
    });

    const existingEnrolledIds = new Set(event.enrollments.map(e => e.userId));

    for (const p of participants) {
      const identifier = (p.email || p.username || '').toLowerCase();
      const userId = userMap.get(identifier);

      if (!userId) {
        failedList.push(`${identifier} (Not found)`);
        continue;
      }

      if (existingEnrolledIds.has(userId)) {
        failedList.push(`${identifier} (Already enrolled)`);
        continue;
      }

      // Check capacity if needed (omitted for admin bulk for now to prioritize forces, but you can add it)
      if (event.maxAttendees && event.enrollments.length + successCount >= event.maxAttendees) {
        failedList.push(`${identifier} (Event full)`);
        continue;
      }

      await prisma.eventEnrollment.create({
        data: {
          eventId: id,
          userId,
          status: 'APPROVED',
        }
      });
      successCount++;
    }

    return NextResponse.json({
      message: `Successfully registered ${successCount} users. Failed: ${failedList.length}`,
      successCount,
      failedList
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Bulk registration error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk registration' },
      { status: 500 }
    );
  }
}
