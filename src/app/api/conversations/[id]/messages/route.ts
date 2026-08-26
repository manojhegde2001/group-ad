import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { socketService } from '@/lib/socket-service';
import { notificationService } from '@/services/notification-service';
import { logger } from '@/lib/logger';
import { createMessageSchema } from '@/lib/validations/content';



// GET /api/conversations/[id]/messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation.participantIds.includes(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        isDeleted: false,
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    logger.error('GET conversation messages error', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/conversations/[id]/messages
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation.participantIds.includes(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check for blocks
    const block = await prisma.block.findFirst({
        where: {
            OR: [
                { blockerId: session.user.id, blockedId: { in: conversation.participantIds.filter(id => id !== session.user.id) } },
                { blockedId: session.user.id, blockerId: { in: conversation.participantIds.filter(id => id !== session.user.id) } },
            ],
        },
    });

    if (block) {
        return NextResponse.json({ error: 'Messaging is disabled due to a block' }, { status: 403 });
    }

    const body = await request.json();
    const { content, messageType = 'TEXT' } = createMessageSchema.parse(body);

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: session.user.id,
          content,
          messageType,
          readBy: [session.user.id],
        },
        include: {
          sender: {
            select: { id: true, name: true, username: true, avatar: true },
          },
        },
      }),
      prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    // Emit via Socket.io
    // 1. Emit to the conversation room
    socketService.emitMessage(id, message);

    // 2. Notify other participants (persists a Notification row + emits via socket)
    const otherParticipants = conversation.participantIds.filter(
      (pid) => pid !== session.user.id
    );
    await Promise.all(otherParticipants.map((pid) =>
      notificationService.create({
        userId: pid,
        type: 'MESSAGE_RECEIVED',
        title: 'New Message',
        message: `${session.user.name} sent you a message`,
        entityType: 'Conversation',
        entityId: id,
        senderId: session.user.id,
      })
    ));

    return NextResponse.json({ message }, { status: 201 });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    logger.error('POST conversation message error', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
