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

    // Get all blocks involving the current user
    const blocks = await prisma.block.findMany({
        where: {
            OR: [
                { blockerId: userId },
                { blockedId: userId },
            ],
        },
        select: { blockerId: true, blockedId: true },
    });

    const blockedIds = new Set(blocks.map(b => 
        b.blockerId === userId ? b.blockedId : b.blockerId
    ));

    // Filter and enrich
    const enriched = (await Promise.all(
      conversations.map(async (conv) => {
        const otherIds = conv.participantIds.filter((id) => id !== userId);
        
        // Skip if any other participant is blocked
        if (otherIds.some(id => blockedIds.has(id))) {
            return null;
        }

        const participants = await prisma.user.findMany({
          where: { id: { in: otherIds } },
          select: { id: true, name: true, username: true, avatar: true },
        });
        const lastMessage = conv.messages[0] || null;
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            NOT: { readBy: { has: userId } },
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
    )).filter(c => c !== null);

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

    // Check for blocks
    const block = await prisma.block.findFirst({
        where: {
            OR: [
                { blockerId: userId, blockedId: participantId },
                { blockerId: participantId, blockedId: userId },
            ],
        },
    });

    if (block) {
        return NextResponse.json({ error: 'Messaging is disabled due to a block' }, { status: 403 });
    }

    // Fetch target user's visibility and messaging settings
    const targetUser = await prisma.user.findUnique({
        where: { id: participantId },
        select: { visibility: true, messagingEnabled: true },
    });

    if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (!targetUser.messagingEnabled) {
        return NextResponse.json({ error: 'This user has disabled direct messaging' }, { status: 403 });
    }

    // If target user is private, check if they are connected
    if (targetUser.visibility === 'PRIVATE') {
        const connection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId: userId, receiverId: participantId, status: 'ACCEPTED' },
                    { requesterId: participantId, receiverId: userId, status: 'ACCEPTED' },
                ],
            },
        });

        if (!connection) {
            return NextResponse.json({ 
                error: 'Messaging is restricted to connections for this private account' 
            }, { status: 403 });
        }
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
