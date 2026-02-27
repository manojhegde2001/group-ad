import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  categoryId: z.string().optional(),
});

// ============================================================================
// GET /api/posts/[id] - Get single post by ID
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;
    const { id: postId } = await params;

    const postRaw = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true, name: true, username: true, avatar: true,
            userType: true, verificationStatus: true, bio: true, location: true,
          },
        },
        category: { select: { id: true, name: true, slug: true, icon: true, description: true } },
        company: {
          select: {
            id: true, name: true, slug: true, logo: true,
            isVerified: true, industry: true, location: true, website: true,
          },
        },
        _count: { select: { postLikes: true, postComments: true } },
        ...(currentUserId
          ? { postLikes: { where: { userId: currentUserId }, select: { userId: true }, take: 1 } }
          : {}),
      },
    });

    if (!postRaw) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment view count fire-and-forget
    prisma.post.update({ where: { id: postId }, data: { views: { increment: 1 } } }).catch(() => { });

    const post = {
      ...(postRaw as any),
      isLikedByUser: currentUserId
        ? Array.isArray((postRaw as any).postLikes) && (postRaw as any).postLikes.length > 0
        : false,
      postLikes: undefined, // strip raw join data
    };

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/posts/[id] - Update post
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: postId } = await params;

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only update your own posts' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    const post = await prisma.post.update({
      where: { id: postId },
      data: validatedData,
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, userType: true, verificationStatus: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
        company: { select: { id: true, name: true, slug: true, logo: true, isVerified: true } },
        _count: { select: { postLikes: true, postComments: true } },
      },
    });

    return NextResponse.json({ message: 'Post updated successfully', post });
  } catch (error: any) {
    console.error('Error updating post:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/posts/[id] - Delete post
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: postId } = await params;

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}