import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { blockedId } = await req.json();

    if (!blockedId) {
      return NextResponse.json({ error: 'Blocked user ID is required' }, { status: 400 });
    }

    if (session.user.id === blockedId) {
      return NextResponse.json({ error: 'You cannot block yourself' }, { status: 400 });
    }

    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: blockedId,
        },
      },
    });

    if (existingBlock) {
      return NextResponse.json({ message: 'User already blocked' });
    }

    // Create block and remove connection if exists
    await prisma.$transaction([
      prisma.block.create({
        data: {
          blockerId: session.user.id,
          blockedId: blockedId,
        },
      }),
      prisma.connection.deleteMany({
        where: {
          OR: [
            { requesterId: session.user.id, receiverId: blockedId },
            { requesterId: blockedId, receiverId: session.user.id },
          ],
        },
      }),
    ]);

    return NextResponse.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block error:', error);
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blockedUsers = await prisma.block.findMany({
      where: { blockerId: session.user.id },
      include: {
        blocked: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(blockedUsers);
  } catch (error) {
    console.error('Get blocked users error:', error);
    return NextResponse.json({ error: 'Failed to fetch blocked users' }, { status: 500 });
  }
}
