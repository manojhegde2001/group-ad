import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/boards/check?postId=[id] — Check which boards a post is in
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const boardPosts = await prisma.boardPost.findMany({
      where: {
        postId,
        board: { userId: session.user.id },
      },
      select: { boardId: true },
    });

    const savedBoardIds = boardPosts.map((bp) => bp.boardId);

    return NextResponse.json({ savedBoardIds });
  } catch (error) {
    console.error('Error checking boards for post:', error);
    return NextResponse.json({ error: 'Failed to check boards' }, { status: 500 });
  }
}
