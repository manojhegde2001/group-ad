import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getPostsServer } from '@/services/server/post-service';
import { enforceRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const createPostSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  images: z.array(z.string().url()).optional().default([]),
  imageMeta: z
    .array(z.object({ w: z.number().positive(), h: z.number().positive() }).nullable())
    .optional(),
  link: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  tags: z.array(z.string()).optional().default([]),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional().default('PUBLIC'),
  commentsEnabled: z.boolean().optional().default(true),
  categoryId: z.string().optional(),
  companyId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      userType: searchParams.get('userType'),
      categoryId: searchParams.get('categoryId'),
      boardId: searchParams.get('boardId'),
      companyId: searchParams.get('companyId'),
      type: searchParams.get('type'),
      visibility: searchParams.get('visibility'),
      userId: searchParams.get('userId'),
      username: searchParams.get('username'),
      search: searchParams.get('search'),
    };

    const result = await getPostsServer(params);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error fetching posts API', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const limited = enforceRateLimit(request, 'posts:create', 20, 10 * 60_000, session.user.id);
    if (limited) return limited;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, userType: true, companyId: true, categoryId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.userType === 'INDIVIDUAL') {
      return NextResponse.json(
        { error: 'Individuals are not allowed to create posts' },
        { status: 403 }
      );
    }



    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    if (validatedData.companyId) {
      if (user.userType !== 'BUSINESS' && user.userType !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only business users can post on behalf of a company' },
          { status: 403 }
        );
      }
      if (user.companyId !== validatedData.companyId && user.userType !== 'ADMIN') {
        return NextResponse.json(
          { error: 'You can only post on behalf of your own company' },
          { status: 403 }
        );
      }
    }

    const post = await prisma.post.create({
      data: {
        type: validatedData.type,
        content: validatedData.content,
        images: validatedData.images,
        imageMeta: validatedData.imageMeta ?? undefined,
        link: validatedData.link || undefined,
        tags: validatedData.tags,
        visibility: validatedData.visibility,
        commentsEnabled: validatedData.commentsEnabled,
        categoryId: user.categoryId, // Auto-assign from user profile
        companyId: validatedData.companyId,
        userId: user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true, userType: true, bio: true, website: true, companyWebsite: true, companyName: true, websiteLabel: true },
        },
        category: { select: { id: true, name: true, slug: true, icon: true } },
        company: { select: { id: true, name: true, slug: true, logo: true, isVerified: true } },
        _count: { select: { postLikes: true, postComments: true } },
      },
    });

    return NextResponse.json(
      { message: 'Post created successfully', post: { ...post, isLikedByUser: false } },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating post', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
