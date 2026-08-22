import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

    // Apply visibility filter only for general feed queries (not profile-specific)
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
    
    if (postType && postType !== 'CREATED') where.type = postType as any;
    
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
      postLikes: undefined,
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
    console.error('Error fetching posts in server service:', error);
    throw error;
  }
}
