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
  commentsEnabled: z.boolean().optional().default(true),
  categoryId: z.string().optional(),
  companyId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const userType = searchParams.get('userType');
    const categoryId = searchParams.get('categoryId');
    const boardId = searchParams.get('boardId');
    const companyId = searchParams.get('companyId');
    const postType = searchParams.get('type');
    const visibility = searchParams.get('visibility') || 'PUBLIC';
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    const search = searchParams.get('search');

    const where: any = {};

    // Apply visibility filter only for general feed queries (not profile-specific)
    // When fetching a specific user's posts, we show all their PUBLIC posts
    const isUserSpecificQuery = !!(userId || username);
    if (!isUserSpecificQuery) {
      where.visibility = (visibility as any) || 'PUBLIC';
    } else {
      where.visibility = 'PUBLIC'; // Show only public posts on profile
    }

    if (currentUserId) {
      const blocks = await prisma.block.findMany({
        where: {
          OR: [
            { blockerId: currentUserId },
            { blockedId: currentUserId },
          ],
        },
        select: { blockerId: true, blockedId: true },
      });

      const blockedIds = blocks.map(b => 
        b.blockerId === currentUserId ? b.blockedId : b.blockerId
      );

      if (blockedIds.length > 0) {
        where.userId = { notIn: blockedIds };
      }
    }

    if (userType) where.user = { userType: userType as any };
    
    if (categoryId && categoryId !== 'null' && categoryId !== 'undefined') {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true, slug: true }
      });

      if (category) {
        where.OR = [
          { user: { categoryId: categoryId } },
          { tags: { has: category.slug } },
          { tags: { has: category.name.toLowerCase() } }
        ];
      } else {
        where.user = { 
          ...(where.user || {}),
          categoryId: categoryId 
        };
      }
    }
    
    if (boardId && boardId !== 'null' && boardId !== 'undefined') {
      where.boardPosts = {
        some: { boardId }
      };
    }
    if (companyId && companyId !== 'null' && companyId !== 'undefined') where.companyId = companyId;
    // 'CREATED' is a UI-only filter meaning 'posts by this user' — skip setting where.type for it
    // Valid PostType values are: IMAGE, TEXT, VIDEO, DOCUMENT
    if (postType && postType !== 'CREATED') where.type = postType as any;
    
    // Resolve username -> userId if username param is passed (e.g. from profile page)
    let resolvedUserId = userId;
    if (username && username !== 'null' && username !== 'undefined') {
      const userByUsername = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (!userByUsername) {
        return NextResponse.json({ posts: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      }
      resolvedUserId = userByUsername.id;
    }

    // If a specific userId is requested, ensure they are not blocked
    if (resolvedUserId && resolvedUserId !== 'null' && resolvedUserId !== 'undefined') {
        if (where.userId?.notIn?.includes(resolvedUserId)) {
            return NextResponse.json({
                posts: [],
                pagination: { total: 0, page, limit, totalPages: 0 },
            });
        }
        where.userId = resolvedUserId;
    }

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
              industry: true,
              website: true,
              companyWebsite: true,
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
          // Include user's like record if logged in
          ...(currentUserId
            ? {
              postLikes: {
                where: { userId: currentUserId },
                select: { userId: true },
                take: 1,
              },
            }
            : {}),
        },
      }),
      prisma.post.count({ where }),
    ]);

    const postsWithMeta = posts.map((post: any) => ({
      ...post,
      isLikedByUser: currentUserId
        ? Array.isArray(post.postLikes) && post.postLikes.length > 0
        : false,
      postLikes: undefined, // strip from response
    }));

    return NextResponse.json({
      posts: postsWithMeta,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, userType: true, companyId: true, categoryId: true, verificationStatus: true },
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
        tags: validatedData.tags,
        visibility: validatedData.visibility,
        commentsEnabled: validatedData.commentsEnabled,
        categoryId: user.categoryId, // Auto-assign from user profile
        companyId: validatedData.companyId,
        userId: user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true, userType: true, verificationStatus: true, bio: true, industry: true, website: true, companyWebsite: true },
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
    console.error('Error creating post:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
