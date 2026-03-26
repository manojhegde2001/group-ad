import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      businessUsers,
      individualUsers,
      totalPosts,
      totalEvents,
      publishedEvents,
      pendingUpgradeRequests,
      pendingVerifications,
      pendingReports,
      recentUsers,
      recentPosts,
      // Trend data
      usersLast30,
      usersPrior30,
      postsLast30,
      postsPrior30,
      eventsLast30,
      eventsPrior30,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { userType: 'BUSINESS' } }),
      prisma.user.count({ where: { userType: 'INDIVIDUAL' } }),
      prisma.post.count(),
      prisma.event.count(),
      prisma.event.count({ where: { status: 'PUBLISHED' } }),
      prisma.userTypeChangeRequest.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
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
      // Trends
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.post.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.post.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.event.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.event.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    ]);

    const calculateTrend = (current: number, prior: number) => {
      if (prior === 0) return current > 0 ? '+100%' : '0%';
      const diff = ((current - prior) / prior) * 100;
      return `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`;
    };

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
        pendingReports,
        trends: {
          users: calculateTrend(usersLast30, usersPrior30),
          posts: calculateTrend(postsLast30, postsPrior30),
          events: calculateTrend(eventsLast30, eventsPrior30),
        },
        periodStats: {
          usersLast30,
          postsLast30,
          eventsLast30,
        }
      },
      recentUsers,
      recentPosts,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
