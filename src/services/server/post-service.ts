import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logger';

// Anonymous visitors all see the same PUBLIC post list for a given filter set, so the
// (uncached) DB round-trip on every request was the main driver of the homepage's slow
// TTFB/LCP. Authenticated requests are never routed through this cache — their query
// depends on per-user blocked-user filtering and like/save flags, so they keep running
// fully live below.
const getCachedPublicPosts = unstable_cache(
  async (where: any, skip: number, limit: number) => {
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
              website: true,
              companyWebsite: true,
              companyName: true,
              websiteLabel: true,
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
      }),
      prisma.post.count({ where }),
    ]);
    return { posts, total };
  },
  ['public-posts-list'],
  { revalidate: 30 }
);

export interface GetPostsParams {
  page?: number;
  limit?: number;
  categoryId?: string | null;
  boardId?: string | null;
  companyId?: string | null;
  type?: string | null;
  visibility?: string | null;
  userId?: string | null;
  username?: string | null;
  search?: string | null;
  userType?: string | null;
}

export async function getPostsServer(params: GetPostsParams) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const {
      userType,
      categoryId,
      boardId,
      companyId,
      type: postType,
      visibility = 'PUBLIC',
      userId,
      username,
      search
    } = params;

    const where: any = {};

    // Resolve the target user (by id or username) before deciding the visibility filter,
    // so the profile owner can see their own private posts.
    let resolvedUserId = userId;
    if (username && username !== 'null' && username !== 'undefined') {
      const userByUsername = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (!userByUsername) {
        return { posts: [], pagination: { total: 0, page, limit, totalPages: 0 } };
      }
      resolvedUserId = userByUsername.id;
    }

    const isUserSpecificQuery = !!(userId || username);
    const isOwnProfileQuery = isUserSpecificQuery && !!currentUserId && currentUserId === resolvedUserId;
    if (!isUserSpecificQuery) {
      where.visibility = (visibility as any) || 'PUBLIC';
    } else if (!isOwnProfileQuery) {
      where.visibility = 'PUBLIC'; // Show only public posts on someone else's profile
    }
    // Own profile: no visibility filter, so PUBLIC and PRIVATE posts both show

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
    
    if (postType && postType !== 'CREATED') where.type = postType as any;

    if (resolvedUserId && resolvedUserId !== 'null' && resolvedUserId !== 'undefined') {
        if (where.userId?.notIn?.includes(resolvedUserId)) {
            return {
                posts: [],
                pagination: { total: 0, page, limit, totalPages: 0 },
            };
        }
        where.userId = resolvedUserId;
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    let posts: any[];
    let total: number;

    if (currentUserId) {
      [posts, total] = await Promise.all([
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
                website: true,
                companyWebsite: true,
                companyName: true,
                websiteLabel: true,
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
            postLikes: {
              where: { userId: currentUserId },
              select: { userId: true },
              take: 1,
            },
            boardPosts: {
              where: { board: { userId: currentUserId } },
              select: { id: true },
              take: 1,
            },
          },
        }),
        prisma.post.count({ where }),
      ]);
    } else {
      ({ posts, total } = await getCachedPublicPosts(where, skip, limit));
    }

    const postsWithMeta = posts.map((post: any) => ({
      ...post,
      isLikedByUser: currentUserId
        ? Array.isArray(post.postLikes) && post.postLikes.length > 0
        : false,
      isSaved: currentUserId
        ? Array.isArray(post.boardPosts) && post.boardPosts.length > 0
        : false,
      postLikes: undefined,
      boardPosts: undefined,
    }));

    return {
      posts: postsWithMeta,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching posts in server service', error);
    throw error;
  }
}
