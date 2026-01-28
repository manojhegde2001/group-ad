import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    const { id: postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            userType: true,
            verificationStatus: true,
            bio: true,
            location: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            description: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            isVerified: true,
            industry: true,
            location: true,
            website: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
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
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string };
    const { id: postId } = await params;

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingPost.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'You can only update your own posts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    // Update post
    const post = await prisma.post.update({
      where: { id: postId },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            userType: true,
            verificationStatus: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            isVerified: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Post updated successfully',
      post,
    });
  } catch (error: any) {
    console.error('Error updating post:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
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
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string };
    const { id: postId } = await params;

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
        user: {
          select: {
            userType: true,
          },
        },
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check ownership (or admin)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { userType: true },
    });

    if (existingPost.userId !== decoded.userId && user?.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Delete post
    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}