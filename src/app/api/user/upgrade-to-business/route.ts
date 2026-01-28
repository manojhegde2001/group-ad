import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Validation schema for upgrade request
const upgradeSchema = z.object({
  reason: z.string().optional(),
  companyId: z.string().optional(),
  companyName: z.string().min(2).optional(),
  turnover: z.string().optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),
  gstNumber: z.string().optional(),
  establishedYear: z.string().optional(),
  companyWebsite: z.string().url().optional().or(z.literal('')),
});

// POST /api/user/upgrade-to-business - Request to upgrade from INDIVIDUAL to BUSINESS
export async function POST(request: NextRequest) {
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

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        userType: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already BUSINESS or ADMIN
    if (user.userType === 'BUSINESS') {
      return NextResponse.json(
        { error: 'You are already a business user' },
        { status: 400 }
      );
    }

    if (user.userType === 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin users cannot be upgraded' },
        { status: 400 }
      );
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.userTypeChangeRequest.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending upgrade request' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = upgradeSchema.parse(body);

    // Create upgrade request
    const upgradeRequest = await prisma.userTypeChangeRequest.create({
      data: {
        userId: user.id,
        fromType: user.userType,
        toType: 'BUSINESS',
        reason: validatedData.reason,
        companyId: validatedData.companyId,
        companyName: validatedData.companyName,
        turnover: validatedData.turnover,
        companySize: validatedData.companySize,
        industry: validatedData.industry,
        gstNumber: validatedData.gstNumber,
        establishedYear: validatedData.establishedYear,
        companyWebsite: validatedData.companyWebsite,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      message: 'Upgrade request submitted successfully. Admin will review your request.',
      request: {
        id: upgradeRequest.id,
        status: upgradeRequest.status,
        createdAt: upgradeRequest.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Upgrade request error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// GET /api/user/upgrade-to-business - Get user's upgrade requests
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string };

    const requests = await prisma.userTypeChangeRequest.findMany({
      where: {
        userId: decoded.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        fromType: true,
        toType: true,
        status: true,
        reason: true,
        reviewNote: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('Error fetching upgrade requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}