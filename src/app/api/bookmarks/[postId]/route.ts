import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const db = prisma as any; // new Bookmark model available at runtime after prisma generate

type RouteParams = { params: Promise<{ postId: string }> };

// GET /api/bookmarks/[postId] — Check if current user bookmarked this post
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ isBookmarked: false });
        }

        const { postId } = await params;

        const bookmark = await db.bookmark.findUnique({
            where: {
                userId_postId: { userId: session.user.id, postId },
            },
        });

        return NextResponse.json({ isBookmarked: !!bookmark });
    } catch (error) {
        console.error('Error checking bookmark:', error);
        return NextResponse.json({ error: 'Failed to check bookmark' }, { status: 500 });
    }
}

// POST /api/bookmarks/[postId] — Bookmark a post
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { postId } = await params;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        await db.bookmark.upsert({
            where: { userId_postId: { userId: session.user.id, postId } },
            create: { userId: session.user.id, postId },
            update: {},
        });

        return NextResponse.json({ message: 'Bookmarked successfully', isBookmarked: true });
    } catch (error) {
        console.error('Error bookmarking post:', error);
        return NextResponse.json({ error: 'Failed to bookmark post' }, { status: 500 });
    }
}

// DELETE /api/bookmarks/[postId] — Remove bookmark
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { postId } = await params;

        await db.bookmark.deleteMany({
            where: { userId: session.user.id, postId },
        });

        return NextResponse.json({ message: 'Bookmark removed', isBookmarked: false });
    } catch (error) {
        console.error('Error removing bookmark:', error);
        return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
    }
}
