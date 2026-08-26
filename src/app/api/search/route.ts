import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

// GET /api/search?q=... — public search across posts, events, and companies.
// Powers the main navbar search bar (see src/components/layout/search-bar.tsx).
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success, resetAt } = rateLimit(`search:${ip}`, 60, 60 * 1000);
    if (!success) return rateLimitResponse(resetAt);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const session = await auth();
    const currentUserId = session?.user?.id ?? null;

    let blockedIds: string[] = [];
    if (currentUserId) {
      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
        },
        select: { blockerId: true, blockedId: true },
      });
      blockedIds = blocks.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId));
    }

    const [posts, events, companies] = await Promise.all([
      prisma.post.findMany({
        where: {
          visibility: 'PUBLIC',
          ...(blockedIds.length > 0 ? { userId: { notIn: blockedIds } } : {}),
          OR: [
            { content: { contains: q, mode: 'insensitive' } },
            { tags: { has: q.toLowerCase() } },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          images: true,
          user: { select: { name: true, username: true } },
        },
      }),
      prisma.event.findMany({
        where: {
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          title: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        orderBy: { startDate: 'asc' },
        select: { id: true, title: true, slug: true, startDate: true, city: true },
      }),
      prisma.company.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        select: {
          id: true,
          name: true,
          location: true,
          logo: true,
          users: { take: 1, select: { username: true } },
        },
      }),
    ]);

    const results = [
      ...posts.map((p) => ({
        id: p.id,
        type: 'post' as const,
        title: p.content.length > 80 ? `${p.content.slice(0, 80)}…` : p.content,
        subtitle: p.user?.name || 'Someone',
        image: p.images?.[0] || null,
        href: `/posts/${p.id}`,
      })),
      ...events.map((e) => ({
        id: e.id,
        type: 'event' as const,
        title: e.title,
        subtitle: e.city || 'Online',
        date: e.startDate,
        href: `/events/${e.slug}`,
      })),
      ...companies
        .filter((c) => c.users.length > 0)
        .map((c) => ({
          id: c.id,
          type: 'company' as const,
          title: c.name,
          subtitle: c.location || 'Business',
          logo: c.logo,
          href: `/profile/${c.users[0].username}`,
        })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    logger.error('GET /api/search error', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
