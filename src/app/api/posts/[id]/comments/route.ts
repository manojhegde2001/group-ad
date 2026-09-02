import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/services/notification-service';
import { enforceRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createCommentSchema } from '@/lib/validations/content';

// GET /api/posts/[id]/comments — fetch comments for a post
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;

        const comments = await prisma.postComment.findMany({
            where: { postId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                        companyName: true,
                    },
                },
            },
        });

        return NextResponse.json({ comments });
    } catch (error) {
        logger.error('Error fetching comments', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

// POST /api/posts/[id]/comments — add a comment to a post
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const limited = enforceRateLimit(request, 'comments:create', 40, 10 * 60_000, session.user.id);
        if (limited) return limited;

        const { id: postId } = await params;
        const body = await request.json();
        const { content } = createCommentSchema.parse(body);

        // Make sure the post exists
        const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, userId: true } });
        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const comment = await prisma.postComment.create({
            data: {
                postId,
                userId: session.user.id,
                content,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                        companyName: true,
                    },
                },
            },
        });

        if (post.userId !== session.user.id) {
            await notificationService.create({
                userId: post.userId,
                type: 'POST_COMMENT',
                title: 'New Comment',
                message: `${session.user.name} commented on your post`,
                entityType: 'Post',
                entityId: postId,
                senderId: session.user.id,
            });
        }

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        logger.error('Error creating comment', error);
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}
