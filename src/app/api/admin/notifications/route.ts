import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();

    if (!session || (session.user as any)?.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get pending business verification requests
    const pendingVerifications = await prisma.userTypeChangeRequest.findMany({
      where: { status: 'PENDING' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, avatar: true } } },
    });

    // 2. Get pending reports
    const pendingReports = await prisma.report.findMany({
      where: { status: 'PENDING' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { reporter: { select: { name: true, avatar: true } } },
    });

    // 3. Combine and format
    const alerts = [
      ...pendingVerifications.map(v => ({
        id: `v-${v.id}`,
        title: 'Verification Request',
        message: `${v.user.name} wants to upgrade to ${v.toType}`,
        time: v.createdAt,
        type: 'system',
        unread: true,
        href: '/admin/businesses', // Deep link to management
      })),
      ...pendingReports.map(r => ({
        id: `r-${r.id}`,
        title: 'New Report Filed',
        message: `${r.reporter.name} reported a ${r.targetType.toLowerCase()}`,
        time: r.createdAt,
        type: 'security',
        unread: true,
        href: '/admin/reports', // Deep link to reports
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({ 
      notifications: alerts.slice(0, 10),
      count: alerts.length 
    });
  } catch (error) {
    console.error('NOTIFICATIONS_ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
