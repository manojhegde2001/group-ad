import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays, eachDayOfInterval, format } from 'date-fns';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 29);

    // 1. Fetch historical data for profile views
    const views = await prisma.profileView.findMany({
      where: {
        viewedId: userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });

    // 2. Aggregate counts by day
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    const trendData = days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'MMM dd'),
        fullDate: dateStr,
        views: views.filter((v) => format(startOfDay(v.createdAt), 'yyyy-MM-dd') === dateStr).length,
      };
    });

    // 3. Get recent viewers (unique viewers)
    const recentViewers = await prisma.profileView.findMany({
      where: {
        viewedId: userId,
        viewerId: { not: null, notIn: [userId] }, // Exclude self and anonymous
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      distinct: ['viewerId'],
      select: {
        createdAt: true,
        viewer: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            userType: true,
          },
        },
      },
    });

    // 4. Summary stats
    const totalViews = await prisma.profileView.count({
      where: { viewedId: userId },
    });

    const uniqueViewers = await prisma.profileView.groupBy({
      by: ['viewerId'],
      where: { 
        viewedId: userId,
        viewerId: { not: null }
      },
      _count: { viewerId: true },
    });

    return NextResponse.json({
      trends: trendData,
      recentViewers: recentViewers.map(v => ({
          ...v.viewer,
          viewedAt: v.createdAt
      })),
      summary: {
        totalViews,
        uniqueViewers: uniqueViewers.length,
      },
    });
  } catch (error) {
    console.error('Profile Analytics Error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile analytics' }, { status: 500 });
  }
}
