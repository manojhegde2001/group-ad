import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const CHECKIN_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-checkin';

// GET /api/events/[id]/check-in/token - Generate a secure signed token for the attendee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enrollment = await prisma.eventEnrollment.findFirst({
      where: {
        eventId,
        userId: session.user.id,
        status: 'APPROVED'
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'No approved enrollment found' }, { status: 404 });
    }

    // Sign a token valid for 24 hours (or just for the event duration)
    const token = jwt.sign(
      { 
        enrollmentId: enrollment.id, 
        eventId, 
        userId: session.user.id 
      }, 
      CHECKIN_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating check-in token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
