import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/posts/my-posts — fetch all posts belonging to the logged-in user
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const posts = await prisma.post.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
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
                    select: { id: true, name: true, slug: true, icon: true },
                },
                company: {
                    select: { id: true, name: true, slug: true, logo: true, isVerified: true },
                },
                _count: {
                    select: { postLikes: true, postComments: true },
                },
            },
        });

        const postsWithCounts = posts.map((post) => ({
            ...post,
            likes: post.likes ?? 0,
            _count: {
                postLikes: post._count.postLikes,
                postComments: post._count.postComments,
            },
        }));

        return NextResponse.json({ posts: postsWithCounts });
    } catch (error) {
        console.error('Error fetching my posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}
