import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { socketService } from '@/lib/socket-service';

// PATCH /api/connections/[id] - accept or reject
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { action } = await request.json(); // 'ACCEPT' | 'REJECT'

    const connection = await prisma.connection.findUnique({
      where: { id },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    if (connection.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.connection.update({
      where: { id },
      data: {
        status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
      },
    });

    if (action === 'ACCEPT') {
      const notification = await prisma.notification.create({
        data: {
          userId: connection.requesterId,
          type: 'CONNECTION_ACCEPTED',
          title: 'Connection Accepted',
          message: 'Your connection request was accepted',
          senderId: session.user.id,
          entityType: 'Connection',
          entityId: connection.id,
        },
      }).catch(() => null);

      if (notification) {
        socketService.notifyUser(connection.requesterId, {
          type: 'CONNECTION_ACCEPTED',
          message: notification.message,
          data: { notificationId: notification.id, senderId: session.user.id }
        });
      }
    }

    return NextResponse.json({ connection: updated });
  } catch (error) {
    console.error('PATCH /api/connections/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
  }
}

// DELETE /api/connections/[id] - remove/cancel connection
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const connection = await prisma.connection.findUnique({
      where: { id },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    const userId = session.user.id;
    if (connection.requesterId !== userId && connection.receiverId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.connection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/connections/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
  }
}
