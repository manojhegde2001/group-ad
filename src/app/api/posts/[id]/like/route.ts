import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/posts/[id]/like — like a post
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id: postId } = await params;

        // Attempt to create a like (ignore if already liked)
        try {
            await prisma.postLike.create({
                data: { postId, userId: session.user.id },
            });
            await prisma.post.update({
                where: { id: postId },
                data: { likes: { increment: 1 } },
            });
        } catch {
            // Already liked — idempotent
        }

        return NextResponse.json({ message: 'Liked' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
    }
}

// DELETE /api/posts/[id]/like — unlike a post
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

        try {
            await prisma.postLike.delete({
                where: { postId_userId: { postId, userId: session.user.id } },
            });
            await prisma.post.update({
                where: { id: postId },
                data: { likes: { decrement: 1 } },
            });
        } catch {
            // Not liked — idempotent
        }

        return NextResponse.json({ message: 'Unliked' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
    }
}
