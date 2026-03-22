import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/following
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all users that the current user follows
    const following = await prisma.user.findMany({
      where: {
        followers: {
          some: {
            followerId: userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        userType: true,
        verificationStatus: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ users: following });
  } catch (error) {
    console.error('GET /api/users/following error:', error);
    return NextResponse.json({ error: 'Failed to fetch following users' }, { status: 500 });
  }
}
