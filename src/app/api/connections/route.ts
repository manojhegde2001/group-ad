import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { firebaseService } from '@/lib/firebase-service';

// GET /api/connections?status=PENDING|ACCEPTED
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ACCEPTED';
    const userId = session.user.id;

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { receiverId: userId },
        ],
        status: status as any,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Enrich with user info
    const enriched = await Promise.all(
      connections.map(async (conn) => {
        const otherId = conn.requesterId === userId ? conn.receiverId : conn.requesterId;
        const otherUser = await prisma.user.findUnique({
          where: { id: otherId },
          select: { id: true, name: true, username: true, avatar: true, userType: true, verificationStatus: true },
        });
        return {
          ...conn,
          user: otherUser,
          direction: conn.requesterId === userId ? 'sent' : 'received',
        };
      })
    );

    return NextResponse.json({ connections: enriched });
  } catch (error) {
    console.error('GET /api/connections error:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

// POST /api/connections - send connection request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { receiverId } = await request.json();
    if (!receiverId) {
      return NextResponse.json({ error: 'receiverId is required' }, { status: 400 });
    }

    const userId = session.user.id;
    const userName = session.user.name || 'A user';
    
    if (userId === receiverId) {
      return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId },
          { requesterId: receiverId, receiverId: userId },
        ],
      },
    });

    if (existing) {
      // If it was rejected, allow re-requesting by deleting the old record
      if (existing.status === 'REJECTED') {
        await prisma.connection.delete({ where: { id: existing.id } });
      } else {
        return NextResponse.json({ error: 'Connection already exists', connection: existing }, { status: 409 });
      }
    }

    const connection = await prisma.connection.create({
      data: {
        requesterId: userId,
        receiverId,
        status: 'PENDING',
      },
    });

    // Create notification for receiver
    const notification = await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'CONNECTION_REQUEST',
        title: 'New Connection Request',
        message: `${userName} has sent you a connection request.`,
        senderId: userId,
        entityType: 'Connection',
        entityId: connection.id,
      },
    }).catch(() => null);

    if (notification) {
      await firebaseService.notifyUser(receiverId, {
        type: 'CONNECTION_REQUEST',
        title: 'New Connection Request',
        message: notification.message,
        data: { notificationId: notification.id, senderId: userId }
      });
    }

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    console.error('POST /api/connections error:', error);
    return NextResponse.json({ error: 'Failed to send connection request' }, { status: 500 });
  }
}
