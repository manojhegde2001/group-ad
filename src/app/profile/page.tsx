import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import ProfileHeader from '@/components/profile/profile-header';
import ProfileTabs from '@/components/profile/profile-tabs';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Profile | Group Ad',
  description: 'Manage your profile and business information',
};

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
        category: true,
        interests: true,
        companyName: true,
        companyLogo: true,
        turnover: true,
        companySize: true,
        industry: true,
        gstNumber: true,
        establishedYear: true,
        companyWebsite: true,
        linkedin: true,
        twitter: true,
        facebook: true,
        instagram: true,
        onboardingStep: true,
        isProfileCompleted: true,
        profileCompletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      redirect('/');
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <ProfileHeader user={user} />
          <ProfileTabs user={user} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
    redirect('/');
  }
}
