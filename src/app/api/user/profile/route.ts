import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  pincode: z.string().max(20).optional().or(z.literal('')),
  externalLink: z.string().url('Invalid external Link URL').optional().or(z.literal('')),
  messagingEnabled: z.boolean().optional(),


  // Category
  categoryId: z.string().optional().or(z.literal('')),
  interests: z.array(z.string()).optional(),

  // Business fields (for BUSINESS users)
  turnover: z.string().optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),
  gstNumber: z.string().optional(),
  establishedYear: z.string().optional(),
  companyWebsite: z.string().url('Invalid website URL').optional().or(z.literal('')),

  // Social links
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  facebook: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  instagram: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),

  // Visibility
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ============================================================================
// GET /api/user/profile - Get current user's profile
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

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
        address: true,
        pincode: true,
        externalLink: true,
        messagingEnabled: true,

        userType: true,
        visibility: true,

        // Verification
        verificationStatus: true,
        verifiedAt: true,
        verificationNote: true,

        // Onboarding
        onboardingStep: true,
        isProfileCompleted: true,
        profileCompletedAt: true,

        // Category
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            description: true,
          },
        },
        interests: true,

        // Company
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            industry: true,
            gstNumber: true,
            website: true,
            description: true,
            location: true,
            isVerified: true,
            verifiedAt: true,
          },
        },

        // Business fields
        companyName: true,
        companyLogo: true,
        turnover: true,
        companySize: true,
        industry: true,
        gstNumber: true,
        establishedYear: true,
        companyWebsite: true,

        // Social links
        linkedin: true,
        twitter: true,
        facebook: true,
        instagram: true,

        createdAt: true,
        updatedAt: true,

        // Relations count
        _count: {
          select: {
            posts: true,
            organizedEvents: true,
            enrollments: true,
            userTypeChangeRequests: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/user/profile - Update current user's profile
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if username is being changed and if it's already taken
    if (validatedData.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: validatedData.username },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
        username: validatedData.username,
        bio: validatedData.bio,
        phone: validatedData.phone || null,
        location: validatedData.location,
        website: validatedData.website || null,
        avatar: validatedData.avatar || null,
        address: validatedData.address || null,
        pincode: validatedData.pincode || null,
        externalLink: validatedData.externalLink || null,
        ...(validatedData.messagingEnabled !== undefined && { messagingEnabled: validatedData.messagingEnabled }),


        categoryId: validatedData.categoryId || null,
        interests: validatedData.interests,

        // Business fields
        turnover: validatedData.turnover || null,
        companySize: validatedData.companySize || null,
        industry: validatedData.industry || null,
        gstNumber: validatedData.gstNumber || null,
        establishedYear: validatedData.establishedYear || null,
        companyWebsite: validatedData.companyWebsite || null,

        // Social links
        linkedin: validatedData.linkedin || null,
        twitter: validatedData.twitter || null,
        facebook: validatedData.facebook || null,
        instagram: validatedData.instagram || null,

        visibility: validatedData.visibility,
      },
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
        address: true,
        pincode: true,
        externalLink: true,
        messagingEnabled: true,
        userType: true,
        visibility: true,
        verificationStatus: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            isVerified: true,
          },
        },
        interests: true,
        turnover: true,
        companySize: true,
        industry: true,
        linkedin: true,
        twitter: true,
        facebook: true,
        instagram: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/user/profile - Change password
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    // Get user's current password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Error changing password:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}