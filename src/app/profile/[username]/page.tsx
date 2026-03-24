import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ProfileView from './profile-view';
import { notFound } from 'next/navigation';

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, bio: true, avatar: true },
  });

  if (!user) return { title: 'User Not Found' };

  return {
    title: `${user.name} (@${username})`,
    description: user.bio || `Connect with ${user.name} on Group Ad — Enterprise Social Networking.`,
    openGraph: {
      title: `${user.name} on Group Ad`,
      description: user.bio || `Connect with ${user.name} on Group Ad.`,
      images: [
        {
          url: user.avatar || '/auth/thumbnail.png',
          width: 1200,
          height: 630,
          alt: user.name,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${user.name} (@${username})`,
      description: user.bio || `Connect with ${user.name} on Group Ad.`,
      images: [user.avatar || '/auth/thumbnail.png'],
    },
  };
}

export default function ProfilePage({ params }: Props) {
  return <ProfileView username={params.username} />;
}
