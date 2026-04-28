import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays, eachDayOfInterval, format } from 'date-fns';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 29);

    // 1. Fetch historical data for trends
    const [users, posts, likes] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.post.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.postLike.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    // 2. Aggregate counts by day using frequency maps (O(N) approach)
    const mapByDay = (items: { createdAt: Date }[]) => {
      return items.reduce((acc: Record<string, number>, item) => {
        const dateStr = format(startOfDay(item.createdAt), 'yyyy-MM-dd');
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc;
      }, {});
    };

    const userMap = mapByDay(users);
    const postMap = mapByDay(posts);
    const likeMap = mapByDay(likes);

    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    const trendData = days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'MMM dd'),
        fullDate: dateStr,
        users: userMap[dateStr] || 0,
        posts: postMap[dateStr] || 0,
        likes: likeMap[dateStr] || 0,
      };
    });

    // 3. Distribution & Top Content
    const [
      userTypeCounts,
      topPosts,
      topEvents,
      topCategories,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ['userType'],
        _count: { id: true },
      }),
      prisma.post.findMany({
        take: 5,
        orderBy: { postLikes: { _count: 'desc' } },
        select: {
          id: true,
          content: true,
          _count: { select: { postLikes: true, postComments: true } },
          user: { select: { name: true, avatar: true } },
        },
      }),
      prisma.event.findMany({
        take: 5,
        orderBy: { enrollments: { _count: 'desc' } },
        select: {
          id: true,
          title: true,
          _count: { select: { enrollments: true } },
        },
      }),
      prisma.category.findMany({
        take: 5,
        orderBy: { events: { _count: 'desc' } },
        select: {
          id: true,
          name: true,
          _count: { select: { events: true } },
        },
      }),
    ]);

    // 4. Summaries
    const totalStats = {
      totalUsers: await prisma.user.count(),
      totalPosts: await prisma.post.count(),
      totalEvents: await prisma.event.count(),
      totalEnrollments: await prisma.eventEnrollment.count(),
    };

    return NextResponse.json({
      trends: trendData,
      distribution: {
        users: userTypeCounts.reduce((acc: any, curr) => {
          acc[curr.userType] = curr._count.id;
          return acc;
        }, {}),
      },
      topContent: {
        posts: topPosts,
        events: topEvents,
        categories: topCategories,
      },
      summary: totalStats,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
