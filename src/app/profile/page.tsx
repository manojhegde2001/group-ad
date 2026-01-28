import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProfileHeader from '@/components/profile/profile-header';
import ProfileTabs from '@/components/profile/profile-tabs';
import { auth } from '@/lib/auth';

export const metadata = {
  title: 'Profile',
  description: 'Manage your profile',
};

async function getProfile() {
  // Use the auth() function from your NextAuth setup
  const session = await auth();

  console.log('[Profile] Session:', session);

  if (!session?.user?.email) {
    console.log('[Profile] No session found, redirecting to home');
    redirect('/');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        phone: true,
        location: true,
        website: true,

        userType: true,
        visibility: true,

        verificationStatus: true,
        verifiedAt: true,

        onboardingStep: true,
        isProfileCompleted: true,

        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        interests: true,

        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            isVerified: true,
          },
        },

        turnover: true,
        companySize: true,
        industry: true,

        linkedin: true,
        twitter: true,
        facebook: true,
        instagram: true,

        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            posts: true,
            organizedEvents: true,
            enrollments: true,
          },
        },
      },
    });

    if (!user) {
      console.log('[Profile] User not found in database');
      redirect('/');
    }

    console.log('[Profile] User found:', user.email);
    return user;
  } catch (error) {
    console.error('[Profile] Error fetching user:', error);
    redirect('/');
  }
}

export default async function ProfilePage() {
  const user = await getProfile();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <ProfileHeader user={user} />
        <ProfileTabs user={user} />
      </div>
    </div>
  );
}