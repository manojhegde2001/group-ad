import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      totalUsers,
      businessUsers,
      individualUsers,
      totalPosts,
      totalEvents,
      publishedEvents,
      pendingUpgradeRequests,
      pendingVerifications,
      recentUsers,
      recentPosts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { userType: 'BUSINESS' } }),
      prisma.user.count({ where: { userType: 'INDIVIDUAL' } }),
      prisma.post.count(),
      prisma.event.count(),
      prisma.event.count({ where: { status: 'PUBLISHED' } }),
      prisma.userTypeChangeRequest.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, username: true, avatar: true, userType: true, verificationStatus: true, createdAt: true },
      }),
      prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { name: true, username: true, avatar: true } },
          _count: { select: { postLikes: true, postComments: true } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        businessUsers,
        individualUsers,
        totalPosts,
        totalEvents,
        publishedEvents,
        pendingUpgradeRequests,
        pendingVerifications,
      },
      recentUsers,
      recentPosts,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
