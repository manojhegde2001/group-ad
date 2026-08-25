import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { PostPageClient } from './post-page-client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      images: true,
      content: true,
      visibility: true,
      user: { select: { name: true, avatar: true } },
    },
  });

  if (!post || post.visibility !== 'PUBLIC') {
    return { title: 'Post' };
  }

  const title = `${post.user.name} on Vrutta`;
  const description = post.content
    ? post.content.length > 160
      ? `${post.content.slice(0, 157)}...`
      : post.content
    : `View this post by ${post.user.name} on Vrutta.`;
  const image = post.images[0] || post.user.avatar;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;

  return <PostPageClient postId={id} />;
}
