import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/conversations/unread-count
// Returns the total number of unread messages across all conversations for the current user.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ totalUnread: 0 }, { status: 401 });
    }

    const userId = session.user.id;

    const totalUnread = await prisma.message.count({
      where: {
        senderId: { not: userId },
        conversation: {
          participantIds: { has: userId },
        },
        NOT: { readBy: { has: userId } },
      },
    });

    return NextResponse.json({ totalUnread });
  } catch (error) {
    console.error('GET /api/conversations/unread-count error:', error);
    return NextResponse.json({ totalUnread: 0 }, { status: 500 });
  }
}
