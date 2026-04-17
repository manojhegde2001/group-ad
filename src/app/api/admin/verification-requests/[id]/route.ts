import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { socketService } from '@/lib/socket-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { status, reviewNote } = await request.json();

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const typeChangeRequest = await prisma.userTypeChangeRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!typeChangeRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Update the request status
    const updatedRequest = await prisma.userTypeChangeRequest.update({
      where: { id },
      data: {
        status,
        reviewNote,
        reviewedBy: session.user.id,
        reviewedAt: new Date()
      }
    });

    if (status === 'APPROVED') {
      // Update the user status to VERIFIED
      await prisma.user.update({
        where: { id: typeChangeRequest.userId },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verificationNote: reviewNote
        }
      });

      // Create a notification for the user
      const notification = await prisma.notification.create({
        data: {
          userId: typeChangeRequest.userId,
          type: 'VERIFICATION_APPROVED',
          title: 'Business Verified!',
          message: 'Your business account has been verified by the admin.',
        }
      }).catch(() => null);

      if (notification) {
        socketService.notifyUser(typeChangeRequest.userId, {
            type: 'VERIFICATION_APPROVED',
            message: notification.message,
            data: { notificationId: notification.id }
        });
      }
    } else {
      // If REJECTED, update user verification status
      await prisma.user.update({
        where: { id: typeChangeRequest.userId },
        data: {
          verificationStatus: 'REJECTED',
          verificationNote: reviewNote
        }
      });

      // Create a notification for the user
      const notification = await prisma.notification.create({
        data: {
          userId: typeChangeRequest.userId,
          type: 'VERIFICATION_REJECTED',
          title: 'Verification Rejected',
          message: `Your business verification was rejected. Reason: ${reviewNote || 'No reason provided.'}`,
        }
      }).catch(() => null);

      if (notification) {
        socketService.notifyUser(typeChangeRequest.userId, {
            type: 'VERIFICATION_REJECTED',
            message: notification.message,
            data: { notificationId: notification.id }
        });
      }
    }

    return NextResponse.json({ 
      message: `Request ${status.toLowerCase()} successfully.`,
      request: updatedRequest 
    });
  } catch (error) {
    console.error('PATCH /api/admin/verification-requests/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
