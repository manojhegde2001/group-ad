import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createBoardSchema } from '@/lib/validations/content';

// GET /api/boards — List current user's boards
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const boards = await prisma.board.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { posts: true }
        },
        posts: {
          take: 4,
          include: {
            post: {
              select: {
                images: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ boards });
  } catch (error) {
    logger.error('Error fetching boards', error);
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}

// POST /api/boards — Create a new board
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const limited = enforceRateLimit(request, 'boards:create', 30, 10 * 60_000, session.user.id);
    if (limited) return limited;

    const body = await request.json();
    const { name, description } = createBoardSchema.parse(body);

    const board = await prisma.board.create({
      data: {
        name,
        description,
        userId: session.user.id,
      },
    });

    return NextResponse.json(board);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    logger.error('Error creating board', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}
