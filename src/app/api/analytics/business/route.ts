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

    // Fetch user with company and category info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true, category: true }
    });

    if (!user || user.userType !== 'BUSINESS' || !user.companyId) {
      return NextResponse.json({ error: 'Business account required' }, { status: 403 });
    }

    const companyId = user.companyId;
    const categoryId = user.categoryId;
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 29);

    // 1. Fetch historical data for company posts reach
    const companyViews = await prisma.postView.findMany({
      where: {
        post: { companyId },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });

    // 2. Fetch category-wide activity (to show trends)
    const categoryPosts = await prisma.post.findMany({
      where: {
        categoryId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });
    
    const categoryEvents = await prisma.event.findMany({
        where: {
            categoryId,
            createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
    });

    // 3. Aggregate counts by day
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    const trendData = days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'MMM dd'),
        fullDate: dateStr,
        companyReach: companyViews.filter((v) => format(startOfDay(v.createdAt), 'yyyy-MM-dd') === dateStr).length,
        categoryGrowth: (categoryPosts.filter((p) => format(startOfDay(p.createdAt), 'yyyy-MM-dd') === dateStr).length + 
                        categoryEvents.filter((e) => format(startOfDay(e.createdAt), 'yyyy-MM-dd') === dateStr).length),
      };
    });

    // 4. Category leaders (other companies in same category)
    const categoryCompetitors = await prisma.company.findMany({
        where: { 
            industry: user.industry,
            id: { not: companyId }
        },
        take: 3,
        include: {
            _count: {
                select: { posts: true, events: true }
            }
        }
    });

    return NextResponse.json({
      trends: trendData,
      categoryInfo: {
          name: user.category?.name || 'Your Industry',
          totalCompetitors: categoryCompetitors.length,
      },
      competitors: categoryCompetitors.map(c => ({
          name: c.name,
          logo: c.logo,
          activity: c._count.posts + c._count.events
      })),
      summary: {
        totalReach: companyViews.length,
        industryRank: 'Top 15%', // Mock logic for now
      },
    });
  } catch (error) {
    console.error('Business Analytics Error:', error);
    return NextResponse.json({ error: 'Failed to fetch business analytics' }, { status: 500 });
  }
}
