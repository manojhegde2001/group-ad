import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPostSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  images: z.array(z.string().url()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional().default('PUBLIC'),
  categoryId: z.string().optional(),
  companyId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const userType = searchParams.get('userType');
    const categoryId = searchParams.get('categoryId');
    const companyId = searchParams.get('companyId');
    const postType = searchParams.get('type');
    const visibility = searchParams.get('visibility') || 'PUBLIC';
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');

    const where: any = {
      visibility: visibility as any,
    };

    if (userType) {
      where.user = {
        userType: userType as any,
      };
    }

    if (categoryId) where.categoryId = categoryId;
    if (companyId) where.companyId = companyId;
    if (postType) where.type = postType as any;
    if (userId) where.userId = userId;

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
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
      }),
      prisma.post.count({ where }),
    ]);

    // Add empty counts for now
    const postsWithCounts = posts.map(post => ({
      ...post,
      _count: {
        postLikes: 0,
        postComments: 0,
      },
    }));

    return NextResponse.json({
      posts: postsWithCounts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        userType: true,
        companyId: true,
        categoryId: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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
        tags: validatedData.tags,
        visibility: validatedData.visibility,
        categoryId: validatedData.categoryId || user.categoryId,
        companyId: validatedData.companyId,
        userId: user.id,
      },
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

    const postWithCount = {
      ...post,
      _count: {
        postLikes: 0,
        postComments: 0,
      },
    };

    return NextResponse.json({
      message: 'Post created successfully',
      post: postWithCount,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating post:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
