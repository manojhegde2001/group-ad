import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import ProfileHeader from '@/components/profile/profile-header';
import ProfileTabs from '@/components/profile/profile-tabs';


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      redirect('/login');
    }

    return user;
  } catch (error) {
    redirect('/login');
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