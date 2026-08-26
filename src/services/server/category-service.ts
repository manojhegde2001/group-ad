import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface GetCategoriesParams {
  active?: boolean;
  trending?: boolean;
  limit?: number;
}

export async function getCategoriesServer(params: GetCategoriesParams = {}) {
  try {
    const { active = true, trending = false, limit } = params;

    const where = active ? { isActive: true } : {};

    const categories = await prisma.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        banner: true,
        isActive: true,
        _count: {
          select: {
            users: true,
            posts: true,
            events: true,
          },
        },
      },
      orderBy: trending 
        ? { posts: { _count: 'desc' as const } } 
        : { name: 'asc' as const },
      ...(limit ? { take: limit } : {}),
    });

    return {
      categories,
      count: categories.length,
    };
  } catch (error) {
    logger.error('Error fetching categories in server service', error);
    throw error;
  }
}
