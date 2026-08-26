import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { renameBoardSchema } from '@/lib/validations/content';

// GET /api/boards/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const board = await prisma.board.findFirst({
      where: { id, userId: session.user.id },
      include: { _count: { select: { posts: true } } }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    logger.error('Error fetching board', error);
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 });
  }
}

// PATCH /api/boards/[id] — Rename a board
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name } = renameBoardSchema.parse(body);

    const board = await prisma.board.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 });
    }

    const updated = await prisma.board.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    logger.error('Error renaming board', error);
    return NextResponse.json({ error: 'Failed to rename board' }, { status: 500 });
  }
}

// DELETE /api/boards/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const board = await prisma.board.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 });
    }

    await prisma.board.delete({ where: { id } });

    return NextResponse.json({ message: 'Board deleted successfully' });
  } catch (error) {
    logger.error('Error deleting board', error);
    return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
  }
}
