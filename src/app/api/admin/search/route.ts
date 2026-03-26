import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session || (session.user as any)?.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const [users, companies, events] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, username: true, avatar: true, userType: true },
      }),
      prisma.company.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: 5,
        select: { id: true, name: true, logo: true, isVerified: true },
      }),
      prisma.event.findMany({
        where: {
          title: { contains: query, mode: 'insensitive' },
        },
        take: 5,
        select: { id: true, title: true, slug: true, status: true },
      }),
    ]);

    const formattedResults = [
      ...users.map(u => ({ id: u.id, title: u.name, subtitle: `@${u.username}`, type: 'user', icon: u.avatar })),
      ...companies.map(c => ({ id: c.id, title: c.name, subtitle: c.isVerified ? 'Verified' : 'Pending', type: 'business', icon: c.logo })),
      ...events.map(e => ({ id: e.id, title: e.title, subtitle: e.status, type: 'event', href: `/events/${e.slug}` })),
    ];

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    console.error('SEARCH_ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
