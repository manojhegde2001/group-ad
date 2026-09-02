import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signupSchema } from '@/lib/validations/auth';
import { sendMail, verificationEmail, getAppBaseUrl } from '@/lib/mailer';
import { logger } from '@/lib/logger';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success, resetAt } = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);
    if (!success) return rateLimitResponse(resetAt);

    const body = await request.json();

    // Validate input
    const validatedData = signupSchema.parse(body);

    const email = validatedData.email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: validatedData.username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email?.toLowerCase() === email) {
        logger.warn('Signup failed: email already registered', { email });
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
      if (existingUser.username === validatedData.username) {
        logger.warn('Signup failed: username already taken', { username: validatedData.username });
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        );
      }
    }

    // If company is selected, verify it exists
    if (validatedData.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: validatedData.companyId },
      });

      if (!company) {
        logger.warn('Signup failed: company does not exist', { companyId: validatedData.companyId });
        return NextResponse.json(
          { error: 'Selected company does not exist' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10);

    // Email verification token — user cannot sign in until this link is clicked
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Create user — always INDIVIDUAL; Business conversion handled via Settings
    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        name: validatedData.name,
        username: validatedData.username,
        userType: 'INDIVIDUAL',
        companyId: validatedData.companyId || undefined,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        userType: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            isVerified: true,
          },
        },
      },
    });

    const baseUrl = getAppBaseUrl(request);

    // Send the email-verification link. Awaited before responding so the client
    // can tell the user to check their inbox. A mail failure does not roll back
    // the signup — the user can request a fresh link from /auth/verify-email.
    try {
      if (user.email) {
        await sendMail({
          to: user.email,
          subject: 'Verify your email - Vrutta',
          html: verificationEmail(user.name || user.username, verificationToken, baseUrl),
        });
        logger.info('Verification email sent successfully', { userId: user.id, email: user.email });
      }
    } catch (mailError) {
      logger.error('Failed to send verification email', mailError, { userId: user.id, email: user.email });
      // We don't fail the signup if the email fails
    }

    logger.info('User signed up successfully', {
      userId: user.id,
      username: user.username,
      email: user.email,
      userType: user.userType,
    });

    return NextResponse.json(
      {
        message: 'Account created. Check your email to verify your account before signing in.',
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      logger.warn('Signup input validation failed', { errors: error.errors });
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Signup error occurred', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
