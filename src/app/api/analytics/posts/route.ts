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

    // 1. Fetch historical data for post views (all posts by user)
    const views = await prisma.postView.findMany({
      where: {
        post: { userId },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });

    // 2. Fetch total likes and comments within the interval
    const [likes, comments] = await Promise.all([
        prisma.postLike.findMany({
            where: {
                post: { userId },
                createdAt: { gte: thirtyDaysAgo }
            },
            select: { createdAt: true }
        }),
        prisma.postComment.findMany({
            where: {
                post: { userId },
                createdAt: { gte: thirtyDaysAgo }
            },
            select: { createdAt: true }
        })
    ]);

    // 3. Aggregate counts by day
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    const trendData = days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'MMM dd'),
        fullDate: dateStr,
        views: views.filter((v) => format(startOfDay(v.createdAt), 'yyyy-MM-dd') === dateStr).length,
        likes: likes.filter((l) => format(startOfDay(l.createdAt), 'yyyy-MM-dd') === dateStr).length,
        comments: comments.filter((c) => format(startOfDay(c.createdAt), 'yyyy-MM-dd') === dateStr).length,
      };
    });

    // 4. Get top performing posts
    const topPosts = await prisma.post.findMany({
        where: { userId },
        take: 5,
        orderBy: { views: 'desc' },
        select: {
            id: true,
            content: true,
            views: true,
            type: true,
            createdAt: true,
            _count: {
                select: { postLikes: true, postComments: true }
            }
        }
    });

    const totalReach = await prisma.post.aggregate({
        where: { userId },
        _sum: { views: true }
    });

    const totalLikes = await prisma.postLike.count({
        where: { post: { userId } }
    });

    const totalPosts = await prisma.post.count({ where: { userId } });

    return NextResponse.json({
      trends: trendData,
      topPosts: topPosts.map(p => ({
          ...p,
          likesCount: p._count.postLikes,
          commentsCount: p._count.postComments
      })),
      summary: {
        totalReach: totalReach._sum.views || 0,
        totalPosts,
        avgLikes: totalPosts > 0 ? (totalLikes / totalPosts).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error('Post Analytics Error:', error);
    return NextResponse.json({ error: 'Failed to fetch post analytics' }, { status: 500 });
  }
}
