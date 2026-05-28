import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  let session: any = null;
  try {
    session = await auth();
    if (!session?.user?.id) {
      logger.warn('Business upgrade request rejected: unauthenticated session');
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

    const userId = session.user.id;

    if (!companyName || !categoryId) {
      logger.warn('Business upgrade request failed: missing fields', { userId, companyName, categoryId });
      return NextResponse.json({ error: 'Company name and category are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true }
    });

    if (!user) {
      logger.warn('Business upgrade request failed: user not found in database', { userId });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for existing pending request
    const existingRequest = await prisma.userTypeChangeRequest.findFirst({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      logger.warn('Business upgrade request failed: existing pending request', { userId });
      return NextResponse.json({ error: 'You already have a pending request' }, { status: 400 });
    }

    // Create the request
    const typeChangeRequest = await prisma.userTypeChangeRequest.create({
      data: {
        userId,
        fromType: user.userType,
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

    // Update user type and set verificationStatus to PENDING
    await prisma.user.update({
      where: { id: userId },
      data: {
        userType: 'BUSINESS',
        verificationStatus: 'PENDING',
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

    logger.info('Business upgrade request submitted successfully', {
      userId,
      companyName,
      requestId: typeChangeRequest.id,
      fromType: typeChangeRequest.fromType,
      toType: typeChangeRequest.toType
    });

    return NextResponse.json({ 
      message: 'Request submitted successfully. Your account is now a Business account (pending verification).',
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
      logger.warn('Retrieving business upgrade request status rejected: unauthenticated session');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    const latestRequest = await prisma.userTypeChangeRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    logger.debug('Retrieved latest business upgrade request status', {
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
