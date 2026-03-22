import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/boards/[id]/posts — Add a post to a board
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: boardId } = await params;
    const { postId } = await request.json();

    if (!boardId || !postId) {
      return NextResponse.json({ error: 'Board ID and Post ID are required' }, { status: 400 });
    }

    // Verify board ownership and existence
    const board = await prisma.board.findFirst({
      where: { 
        id: boardId, 
        userId: session.user.id 
      },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 });
    }

    // Check if post-board connection already exists
    const existing = await prisma.boardPost.findFirst({
      where: {
        boardId: boardId,
        postId: postId,
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Post is already in this board' });
    }

    // Create the connection using idiomatic connect
    const boardPost = await prisma.boardPost.create({
      data: {
        board: { connect: { id: boardId } },
        post: { connect: { id: postId } },
      },
    });

    return NextResponse.json(boardPost);
  } catch (error: any) {
    console.error('Error adding post to board:', error);
    return NextResponse.json({ 
      error: 'Failed to add post to board',
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/boards/[id]/posts — Remove a post from a board
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: boardId } = await params;
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Verify board ownership
    const board = await prisma.board.findFirst({
      where: { id: boardId, userId: session.user.id },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    await prisma.boardPost.deleteMany({
      where: {
        boardId,
        postId,
      },
    });

    return NextResponse.json({ message: 'Post removed from board' });
  } catch (error) {
    console.error('Error removing post from board:', error);
    return NextResponse.json({ error: 'Failed to remove post from board' }, { status: 500 });
  }
}
