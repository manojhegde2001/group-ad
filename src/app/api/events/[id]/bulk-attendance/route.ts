import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const bulkAttendanceSchema = z.object({
  attendees: z.array(z.object({
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
    const { attendees } = bulkAttendanceSchema.parse(body);

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let successCount = 0;
    let failedList: string[] = [];

    const identifiers = attendees.map(a => a.email || a.username).filter(Boolean) as string[];
    
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

    // Find all approved enrollments
    const enrollments = await prisma.eventEnrollment.findMany({
      where: { eventId: id, status: 'APPROVED' },
      select: { userId: true, attended: true }
    });
    
    const enrollmentMap = new Map(enrollments.map(e => [e.userId, e]));
    const newlyAttendedUserIds: string[] = [];

    for (const a of attendees) {
      const identifier = (a.email || a.username || '').toLowerCase();
      const userId = userMap.get(identifier);

      if (!userId) {
        failedList.push(`${identifier} (Not found)`);
        continue;
      }

      const enrollment = enrollmentMap.get(userId);
      if (!enrollment) {
        failedList.push(`${identifier} (Not enrolled/approved)`);
        continue;
      }

      if (enrollment.attended) {
        failedList.push(`${identifier} (Already attended)`);
        continue;
      }

      // Mark as attended
      await prisma.eventEnrollment.updateMany({
        where: { eventId: id, userId },
        data: { attended: true, attendedAt: new Date() }
      });

      newlyAttendedUserIds.push(userId);
      successCount++;
    }

    // Send notifications to newly attended users
    if (newlyAttendedUserIds.length > 0) {
      const notifications = newlyAttendedUserIds.map(userId => ({
        userId,
        actorId: session.user.id,
        type: 'MEETING_INVITE' as const,
        title: `You attended ${event.title}!`,
        message: 'Connect with fellow attendees to grow your network.',
        entityType: 'event',
        entityId: id,
        read: false,
      }));

      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json({
      message: `Successfully marked ${successCount} users as attended. Failed: ${failedList.length}`,
      successCount,
      failedList
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Bulk attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk attendance' },
      { status: 500 }
    );
  }
}
