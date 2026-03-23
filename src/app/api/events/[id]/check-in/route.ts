import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const CHECKIN_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-checkin';

// POST /api/events/[id]/check-in - Verify and mark attendance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing check-in token' }, { status: 400 });
    }

    // 1. Verify Token
    let decoded: any;
    try {
      decoded = jwt.verify(token, CHECKIN_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired ticket' }, { status: 400 });
    }

    const { enrollmentId, eventId: tokenEventId } = decoded;

    if (tokenEventId !== eventId) {
      return NextResponse.json({ error: 'Ticket is for a different event' }, { status: 400 });
    }

    // 2. Verify Caller is Organizer/Admin
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });

    const isOrganizer = event?.organizerId === session.user.id;
    const isAdmin = (session.user as any).userType === 'ADMIN';

    if (!isOrganizer && !isAdmin) {
      return NextResponse.json({ error: 'Only organizers can check-in attendees' }, { status: 403 });
    }

    // 3. Update Enrollment
    const enrollment = await prisma.eventEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: { select: { name: true, avatar: true } } }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Attendee is not approved for this event' }, { status: 400 });
    }

    if (enrollment.attended) {
      return NextResponse.json({ 
        message: 'Already checked in', 
        attendee: enrollment.user,
        attendedAt: enrollment.attendedAt 
      });
    }

    const updated = await prisma.eventEnrollment.update({
      where: { id: enrollmentId },
      data: {
        attended: true,
        attendedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: `Checked in ${enrollment.user.name} successfully!`,
      attendee: enrollment.user
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
