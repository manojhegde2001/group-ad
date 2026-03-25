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

    const { id: userId } = await params;
    const { status, userType, note } = await request.json();

    if (status !== 'VERIFIED' && status !== 'UNVERIFIED' && status !== 'REJECTED') {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Determine target userType if not provided
    let targetUserType = userType;
    if (!targetUserType && status === 'UNVERIFIED') {
        targetUserType = 'INDIVIDUAL';
    } else if (!targetUserType && status === 'VERIFIED') {
        targetUserType = 'BUSINESS';
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: status,
        ...(targetUserType ? { userType: targetUserType as any } : {}),
        verificationNote: note,
        ...(status === 'VERIFIED' ? { verifiedAt: new Date() } : { verifiedAt: null }),
      },
    });

    // Notify user
    if (status === 'VERIFIED') {
        const notification = await prisma.notification.create({
            data: {
              userId,
              type: 'VERIFICATION_APPROVED',
              title: 'Account Verified!',
              message: 'Your account has been manually verified by an administrator.',
            }
        }).catch(() => null);

        if (notification) {
            socketService.notifyUser(userId, {
                type: 'VERIFICATION_APPROVED',
                message: notification.message,
                data: { notificationId: notification.id }
            });
        }
    }

    return NextResponse.json({ 
      message: 'User updated successfully', 
      user: updatedUser 
    });
  } catch (error) {
    console.error('PATCH /api/admin/users/[id]/verify error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
