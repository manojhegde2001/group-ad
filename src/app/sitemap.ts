import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://group-ad.vercel.app';

  // Static routes
  const routes = [
    '',
    '/explore',
    '/about',
    '/contact',
    '/terms',
    '/privacy-policy',
    '/login',
    '/signup',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    // Dynamic Category routes
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const categoryRoutes = categories.map((cat) => ({
      url: `${baseUrl}/explore/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Dynamic Public User Profile routes
    const users = await prisma.user.findMany({
      where: { 
        visibility: 'PUBLIC',
        isProfileCompleted: true 
      },
      select: { username: true, updatedAt: true },
      take: 1000, // Limit for safety, can be increased or paginated
    });

    const userRoutes = users.map((user) => ({
      url: `${baseUrl}/profile/${user.username}`,
      lastModified: user.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...routes, ...categoryRoutes, ...userRoutes];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return routes;
  }
}
