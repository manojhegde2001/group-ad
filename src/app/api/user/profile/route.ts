import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  category: z.string().optional(),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  turnover: z.string().optional(),
  gstNumber: z.string().optional(),
  establishedYear: z.string().optional(),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    if (validatedData.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: validatedData.username },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        );
      }
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        bio: true,
        avatar: true,
        userType: true,
        companyName: true,
        onboardingStep: true,
        isProfileCompleted: true,
      },
    });

    let onboardingStep = currentUser?.onboardingStep;
    let isProfileCompleted = currentUser?.isProfileCompleted;

    if (validatedData.bio && !currentUser?.bio) {
      onboardingStep = 'BIO_COMPLETED';
    }

    if (
      currentUser?.userType === 'BUSINESS' &&
      (validatedData.companyName || currentUser?.companyName) &&
      onboardingStep !== 'PROFILE_COMPLETED'
    ) {
      onboardingStep = 'BUSINESS_INFO_COMPLETED';
    }

    const hasAvatar = currentUser?.avatar;
    const hasBio = validatedData.bio || currentUser?.bio;
    const isBusinessComplete = 
      currentUser?.userType === 'INDIVIDUAL' || 
      (validatedData.companyName || currentUser?.companyName);

    if (hasAvatar && hasBio && isBusinessComplete && !isProfileCompleted) {
      onboardingStep = 'PROFILE_COMPLETED';
      isProfileCompleted = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...validatedData,
        onboardingStep,
        isProfileCompleted,
        profileCompletedAt: isProfileCompleted && !currentUser?.isProfileCompleted 
          ? new Date() 
          : undefined,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
