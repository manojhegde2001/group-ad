import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  commentsEnabled: z.boolean().optional(),
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
            userType: true, verificationStatus: true, bio: true, location: true, industry: true,
            website: true, companyWebsite: true,
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

    // Record post view for analytics (detailed + counter)
    if (postId) {
      Promise.all([
        prisma.post.update({ where: { id: postId }, data: { views: { increment: 1 } } }),
        prisma.postView.create({
          data: {
            postId: postId,
            viewerId: currentUserId,
          }
        })
      ]).catch((err) => console.error('Error recording post view:', err));
    }

    // Fetch connection status if user is logged in
    let connectionRecord = null;
    let mutualConnections: { count: number; avatars: string[] } = { count: 0, avatars: [] };
    if (currentUserId && currentUserId !== postRaw.user.id) {
      const [connRec, myConns, theirConns] = await Promise.all([
        prisma.connection.findFirst({
          where: {
            OR: [
              { requesterId: currentUserId, receiverId: postRaw.user.id },
              { requesterId: postRaw.user.id, receiverId: currentUserId },
            ],
          },
        }),
        prisma.connection.findMany({
          where: { status: 'ACCEPTED', OR: [{ requesterId: currentUserId }, { receiverId: currentUserId }] },
          select: { requesterId: true, receiverId: true }
        }),
        prisma.connection.findMany({
          where: { status: 'ACCEPTED', OR: [{ requesterId: postRaw.user.id }, { receiverId: postRaw.user.id }] },
          select: { requesterId: true, receiverId: true }
        })
      ]);

      connectionRecord = connRec;

      const myFriends = new Set(myConns.map(c => c.requesterId === currentUserId ? c.receiverId : c.requesterId));
      const theirFriends = theirConns.map(c => c.requesterId === postRaw.user.id ? c.receiverId : c.requesterId);
      const mutualIds = theirFriends.filter(id => myFriends.has(id));
      
      if (mutualIds.length > 0) {
        const mutualUsers = await prisma.user.findMany({
          where: { id: { in: mutualIds } },
          select: { avatar: true },
          take: 3
        });
        mutualConnections = {
          count: mutualIds.length,
          avatars: mutualUsers.map(u => u.avatar).filter(Boolean) as string[]
        };
      }
    }

    const post = {
      ...(postRaw as any),
      isLikedByUser: currentUserId
        ? Array.isArray((postRaw as any).postLikes) && (postRaw as any).postLikes.length > 0
        : false,
      postLikes: undefined, // strip raw join data
      user: {
        ...(postRaw.user as any),
        connectionStatus: connectionRecord?.status || null,
        connectionInitiator: connectionRecord?.requesterId === currentUserId,
        mutualConnections,
      }
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
        user: { select: { id: true, name: true, username: true, avatar: true, userType: true, verificationStatus: true, bio: true, industry: true, website: true, companyWebsite: true } },
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

    const isAdmin = (session.user as any).userType === 'ADMIN';

    if (existingPost.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'You do not have permission to delete this post' }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}