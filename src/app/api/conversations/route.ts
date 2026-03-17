import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/conversations - list all conversations for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participantIds: { has: userId },
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true, username: true, avatar: true },
            },
          },
        },
      },
    });

    // Enrich with participant user info
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherIds = conv.participantIds.filter((id) => id !== userId);
        const participants = await prisma.user.findMany({
          where: { id: { in: otherIds } },
          select: { id: true, name: true, username: true, avatar: true },
        });
        const lastMessage = conv.messages[0] || null;
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            NOT: { readBy: { has: userId } },  // messages where current user hasn't read
          },
        });
        return {
          id: conv.id,
          participants,
          lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: enriched });
  } catch (error) {
    console.error('GET /api/conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/conversations - start or get a 1:1 conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { participantId } = await request.json();
    if (!participantId) {
      return NextResponse.json({ error: 'participantId is required' }, { status: 400 });
    }

    const userId = session.user.id;
    if (userId === participantId) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participantIds: { has: userId } },
          { participantIds: { has: participantId } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ conversation: existing });
    }

    const conversation = await prisma.conversation.create({
      data: {
        participantIds: [userId, participantId],
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('POST /api/conversations error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
