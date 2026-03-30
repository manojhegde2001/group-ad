import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ExploreView from './explore-view';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.name} Updates`,
    description: category.description || `Explore professional updates and business networking in the ${category.name} category on Group Ad.`,
    openGraph: {
      title: `${category.name} on Group Ad`,
      description: category.description || `Explore the latest from ${category.name} professionals.`,
      images: [
        {
          url: 'https://drive.google.com/uc?export=download&id=1C8sCXdXsuwVadNbQJ1ycoBBa84okc9A1',
          width: 1200,
          height: 630,
          alt: category.name,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | Group Ad`,
      description: category.description || `Explore professional updates from ${category.name}.`,
      images: ['https://drive.google.com/uc?export=download&id=1C8sCXdXsuwVadNbQJ1ycoBBa84okc9A1'],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug: slug },
    select: { id: true, name: true, slug: true },
  });

  if (!category) return notFound();

  return <ExploreView category={category} />;
}
