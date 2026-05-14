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
    select: { name: true, bio: true, avatar: true },
  });

  if (!user) return { title: 'User Not Found' };

  return {
    title: `${user.name} (@${username})`,
    description: user.bio || `Connect with ${user.name} on Vrutta — Enterprise Social Networking.`,
    openGraph: {
      title: `${user.name} on Vrutta`,
      description: user.bio || `Connect with ${user.name} on Vrutta.`,
      images: [
        {
          url: user.avatar || 'https://drive.google.com/uc?export=download&id=1C8sCXdXsuwVadNbQJ1ycoBBa84okc9A1',
          width: 1200,
          height: 630,
          alt: user.name,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${user.name} (@${username})`,
      description: user.bio || `Connect with ${user.name} on Vrutta.`,
      images: [user.avatar || 'https://drive.google.com/uc?export=download&id=1C8sCXdXsuwVadNbQJ1ycoBBa84okc9A1'],
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
