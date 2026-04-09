import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getIO } from '@/lib/socket-io';
import { socketService } from '@/lib/socket-service';
import { sendFirestoreMessage, syncConversationToFirestore } from '@/lib/firebase-chat';
import { sendPushNotification } from '@/lib/fcm-service';



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
    console.error('GET conversation messages error:', error);
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

    const { content, messageType = 'TEXT' } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: session.user.id,
          content: content.trim(),
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

    // Emit Socket.io events
    // 1. Emit to the conversation channel for real-time chat update
    socketService.emitMessage(id, message);

    // 2. Emit to other participants for unread message badges
    const otherParticipants = conversation.participantIds.filter(
      (pid) => pid !== session.user.id
    );
    otherParticipants.forEach((pid) => {
      socketService.notifyUser(pid, {
        type: 'MESSAGE_RECEIVED',
        message: `New message from ${session.user.name}`,
        data: { conversationId: id, message }
      });
    });

    // 3. Write to Firestore for real-time chat (New)
    try {
      await sendFirestoreMessage({
        conversationId: id,
        senderId: session.user.id,
        content: content.trim(),
        type: messageType
      });
      // Ensure participants are synced (one-time or check)
      await syncConversationToFirestore(id, conversation.participantIds);
    } catch (fsError) {
      console.error('Firestore write error (non-blocking):', fsError);
    }


    // 4. Send FCM Push Notification (New)
    try {
        const receiverIds = conversation.participantIds.filter(pid => pid !== session.user.id);
        const receivers = await prisma.user.findMany({
            where: { id: { in: receiverIds } },
            select: { fcmTokens: true }
        });

        for (const receiver of receivers) {
            if (receiver.fcmTokens && receiver.fcmTokens.length > 0) {
                for (const token of receiver.fcmTokens) {
                    await sendPushNotification(token, {
                        title: `New message from ${session.user.name}`,
                        body: content.trim(),
                        data: {
                            conversationId: id,
                            type: 'MESSAGE_RECEIVED'
                        }
                    });
                }
            }
        }
    } catch (pushError) {
        console.error('FCM push error (non-blocking):', pushError);
    }

    return NextResponse.json({ message }, { status: 201 });

  } catch (error) {
    console.error('POST conversation message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
