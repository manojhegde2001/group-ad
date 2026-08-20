import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  let session: any = null;
  try {
    session = await auth();
    if (!session?.user?.id) {
      logger.warn('Business conversion request rejected: unauthenticated session');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName,
      categoryId,
      gstNumber,
      turnover,
      companySize,
      establishedYear,
      companyWebsite,
      reason
    } = body;

    const userId = session.user.id;

    if (!companyName || !categoryId) {
      logger.warn('Business conversion request failed: missing required fields', { userId, companyName, categoryId });
      return NextResponse.json({ error: 'Company name and category are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true }
    });

    if (!user) {
      logger.warn('Business conversion request failed: user not found', { userId });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only INDIVIDUAL users can request a conversion
    if (user.userType === 'BUSINESS') {
      return NextResponse.json({ error: 'You are already a Business account' }, { status: 400 });
    }

    if (user.userType === 'ADMIN') {
      return NextResponse.json({ error: 'Admin accounts cannot be converted' }, { status: 400 });
    }

    // Check for an existing PENDING request — block duplicate submissions
    const existingPending = await prisma.userTypeChangeRequest.findFirst({
      where: { userId, status: 'PENDING' }
    });

    if (existingPending) {
      logger.warn('Business conversion request failed: existing pending request', { userId });
      return NextResponse.json({ error: 'You already have a pending conversion request' }, { status: 400 });
    }

    // Create the conversion request.
    // IMPORTANT: The user's userType and verificationStatus are NOT updated here.
    // The user remains INDIVIDUAL until the Admin explicitly approves the request.
    const typeChangeRequest = await prisma.userTypeChangeRequest.create({
      data: {
        userId,
        fromType: user.userType,
        toType: 'BUSINESS',
        companyName,
        categoryId,
        gstNumber,
        turnover,
        companySize,
        establishedYear,
        companyWebsite,
        reason,
        status: 'PENDING'
      }
    });

    logger.info('Business conversion request submitted successfully', {
      userId,
      companyName,
      categoryId,
      requestId: typeChangeRequest.id,
    });

    return NextResponse.json({
      message: 'Conversion request submitted. An admin will review your application.',
      request: typeChangeRequest
    });
  } catch (error) {
    logger.error('POST /api/user/type-change/request failed', error, { userId: session?.user?.id });
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  let session: any = null;
  try {
    session = await auth();
    if (!session?.user?.id) {
      logger.warn('Retrieving business conversion request status rejected: unauthenticated session');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    const latestRequest = await prisma.userTypeChangeRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    logger.debug('Retrieved latest business conversion request status', {
      userId,
      requestId: latestRequest?.id || null,
      status: latestRequest?.status || null
    });

    return NextResponse.json({ request: latestRequest });
  } catch (error) {
    logger.error('GET /api/user/type-change/request failed', error, { userId: session?.user?.id });
    return NextResponse.json({ error: 'Failed to fetch request status' }, { status: 500 });
  }
}
