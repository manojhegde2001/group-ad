import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName,
      categoryId,
      industry,
      gstNumber,
      turnover,
      companySize,
      establishedYear,
      companyWebsite,
      reason
    } = body;

    if (!companyName || !categoryId) {
      return NextResponse.json({ error: 'Company name and category are required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Check for existing pending request
    const existingRequest = await prisma.userTypeChangeRequest.findFirst({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'You already have a pending request' }, { status: 400 });
    }

    // Create the request
    const typeChangeRequest = await prisma.userTypeChangeRequest.create({
      data: {
        userId,
        fromType: 'INDIVIDUAL',
        toType: 'BUSINESS',
        companyName,
        industry,
        gstNumber,
        turnover,
        companySize,
        establishedYear,
        companyWebsite,
        reason,
        status: 'PENDING'
      }
    });

    // Immediately update user type to BUSINESS (but verificationStatus stays UNVERIFIED until approved)
    await prisma.user.update({
      where: { id: userId },
      data: {
        userType: 'BUSINESS',
        verificationStatus: 'PENDING', // Set to PENDING since they just requested verification
        companyName,
        categoryId,
        industry,
        gstNumber,
        turnover,
        companySize,
        establishedYear,
        companyWebsite
      }
    });

    return NextResponse.json({ 
      message: 'Request submitted successfully. Your account is now a Business account (pending verification).',
      request: typeChangeRequest 
    });
  } catch (error) {
    console.error('POST /api/user/type-change/request error:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    const latestRequest = await prisma.userTypeChangeRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ request: latestRequest });
  } catch (error) {
    console.error('GET /api/user/type-change/request error:', error);
    return NextResponse.json({ error: 'Failed to fetch request status' }, { status: 500 });
  }
}
