import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/conversations/[id]/read
// Marks all messages in this conversation as read by the current user.
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;

    // Verify user is a participant
    const conv = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participantIds: { has: userId },
      },
    });

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Find all messages not yet read by current user (sent by others)
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        NOT: { readBy: { has: userId } },
      },
      select: { id: true, readBy: true },
    });

    // Update each: add userId to readBy
    await Promise.all(
      unreadMessages.map((msg) =>
        prisma.message.update({
          where: { id: msg.id },
          data: { readBy: { push: userId } },
        })
      )
    );

    return NextResponse.json({ ok: true, marked: unreadMessages.length });
  } catch (error) {
    console.error('PATCH /api/conversations/[id]/read error:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
