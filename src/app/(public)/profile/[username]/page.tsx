import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ProfileView from './profile-view';
import { notFound } from 'next/navigation';
import { getPostsServer } from '@/services/server/post-service';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, companyName: true, bio: true, avatar: true },
  });

  if (!user) return { title: 'User Not Found' };

  const displayName = user.companyName || user.name;
  const fallbackImage = 'https://drive.google.com/uc?export=download&id=1C8sCXdXsuwVadNbQJ1ycoBBa84okc9A1';
  const ogImage = user.avatar || fallbackImage;

  return {
    title: `${displayName} (@${username})`,
    description: user.bio || `Connect with ${displayName} on Vrutta — Enterprise Professional Ecosystem.`,
    openGraph: {
      title: `${displayName} on Vrutta`,
      description: user.bio || `Connect with ${displayName} on Vrutta.`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: displayName,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} (@${username})`,
      description: user.bio || `Connect with ${displayName} on Vrutta.`,
      images: [ogImage],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  
  const initialPosts = await getPostsServer({ 
    username, 
    type: 'CREATED',
    limit: 12 
  });

  return <ProfileView username={username} initialPosts={initialPosts} />;
}
