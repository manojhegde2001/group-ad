import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verify(token, JWT_SECRET) as { userId: string };

    // Fetch user with relations
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
        category: true,
        interests: true,
        turnover: true,
        companySize: true,
        industry: true,
        linkedin: true,
        twitter: true,
        facebook: true,
        instagram: true,
        isProfileCompleted: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            industry: true,
            location: true,
            isVerified: true,
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
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}