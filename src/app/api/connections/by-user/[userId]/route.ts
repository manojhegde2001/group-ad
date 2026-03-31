import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { socketService } from '@/lib/socket-service';

// PATCH /api/connections/by-user/[userId] - Accept or Reject a connection request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { action } = await request.json(); // 'ACCEPT' | 'REJECT'
    const currentUserId = session.user.id;

    // Find the connection where the current user is the receiver
    const connection = await prisma.connection.findFirst({
      where: {
        requesterId: targetUserId,
        receiverId: currentUserId,
        status: 'PENDING',
      },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Pending connection request not found' }, { status: 404 });
    }

    const updated = await prisma.connection.update({
      where: { id: connection.id },
      data: {
        status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
      },
    });

    if (action === 'ACCEPT') {
      const notification = await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'CONNECTION_ACCEPTED',
          title: 'Connection Accepted',
          message: `${session.user.name} has accepted your connection request.`,
          senderId: currentUserId,
          entityType: 'Connection',
          entityId: connection.id,
        },
      }).catch(() => null);

      if (notification) {
        socketService.notifyUser(targetUserId, {
          type: 'CONNECTION_ACCEPTED',
          message: notification.message,
          data: { notificationId: notification.id, senderId: currentUserId }
        });
      }
    }

    return NextResponse.json({ connection: updated });
  } catch (error) {
    console.error('PATCH /api/connections/by-user/[userId] error:', error);
    return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
  }
}

// DELETE /api/connections/by-user/[userId] - Remove an existing connection or cancel a request
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Find any connection between these two users
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: currentUserId },
        ],
      },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    await prisma.connection.delete({ where: { id: connection.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/connections/by-user/[userId] error:', error);
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
  }
}
