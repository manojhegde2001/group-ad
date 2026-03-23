import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/search?q=...
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } },
          {
            blocksReceived: {
              none: { blockerId: session.user.id }
            }
          },
          {
            blocksSent: {
              none: { blockedId: session.user.id }
            }
          },
          {
            followers: {
              some: {
                followerId: session.user.id,
              },
            },
          },
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { username: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        userType: true,
        verificationStatus: true,
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /api/users/search error:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
