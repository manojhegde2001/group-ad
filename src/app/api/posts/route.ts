import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createPostSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  images: z.array(z.string().url()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional().default('PUBLIC'),
  categoryId: z.string().optional(), // Optional category
  companyId: z.string().optional(),  // Optional company (for business users)
});

const updatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  categoryId: z.string().optional(),
});

// ============================================================================
// GET /api/posts - Fetch all posts with filters
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filters
    const userType = searchParams.get('userType'); // INDIVIDUAL, BUSINESS, ADMIN
    const categoryId = searchParams.get('categoryId');
    const companyId = searchParams.get('companyId');
    const postType = searchParams.get('type'); // TEXT, IMAGE, VIDEO, DOCUMENT
    const visibility = searchParams.get('visibility') || 'PUBLIC';
    const userId = searchParams.get('userId'); // Filter by specific user
    const search = searchParams.get('search'); // Search in content/tags

    // Build where clause
    const where: any = {
      visibility: visibility as any,
    };

    if (userType) {
      where.user = {
        userType: userType as any,
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (postType) {
      where.type = postType as any;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    // Fetch posts
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
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/posts - Create a new post
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verify(token, JWT_SECRET) as { userId: string };

    // Get user with company info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    // Validate company post (only business users can post on behalf of company)
    if (validatedData.companyId) {
      if (user.userType !== 'BUSINESS' && user.userType !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only business users can post on behalf of a company' },
          { status: 403 }
        );
      }

      // Verify user belongs to this company
      if (user.companyId !== validatedData.companyId && user.userType !== 'ADMIN') {
        return NextResponse.json(
          { error: 'You can only post on behalf of your own company' },
          { status: 403 }
        );
      }
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        type: validatedData.type,
        content: validatedData.content,
        images: validatedData.images,
        tags: validatedData.tags,
        visibility: validatedData.visibility,
        categoryId: validatedData.categoryId || user.categoryId, // Use user's category if not provided
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

    return NextResponse.json({
      message: 'Post created successfully',
      post,
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