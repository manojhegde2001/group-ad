import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const db = prisma as any; // new Bookmark model available at runtime after prisma generate

// GET /api/bookmarks — Get user's bookmarked posts (paginated)
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const [bookmarks, total] = await Promise.all([
            db.bookmark.findMany({
                where: { userId: session.user.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    post: {
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
                            category: { select: { id: true, name: true, slug: true, icon: true } },
                            company: { select: { id: true, name: true, slug: true, logo: true, isVerified: true } },
                            _count: { select: { postLikes: true, postComments: true } },
                            postLikes: {
                                where: { userId: session.user.id },
                                select: { userId: true },
                                take: 1,
                            },
                        },
                    },
                },
            }),
            db.bookmark.count({ where: { userId: session.user.id } }),
        ]);

        const posts = bookmarks.map((b: any) => ({
            ...b.post,
            isLikedByUser: Array.isArray(b.post.postLikes) && b.post.postLikes.length > 0,
            isBookmarked: true,
            postLikes: undefined,
            bookmarkedAt: b.createdAt,
        }));

        return NextResponse.json({
            posts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
    }
}
