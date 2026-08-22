import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signupSchema } from '@/lib/validations/auth';
import { sendMail, welcomeEmail, getAppBaseUrl } from '@/lib/mailer';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
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

    // Create user — always INDIVIDUAL; Business conversion handled via Settings
    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        name: validatedData.name,
        username: validatedData.username,
        userType: 'INDIVIDUAL',
        companyId: validatedData.companyId || undefined,
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

    // Send Welcome Email (Non-blocking but awaited before response for reliability)
    try {
      if (user.email) {
        await sendMail({
          to: user.email,
          subject: 'Welcome to Vrutta!',
          html: welcomeEmail(user.name || user.username, user.email, baseUrl),
        });
        logger.info('Welcome email sent successfully', { userId: user.id, email: user.email });
      }
    } catch (mailError) {
      logger.error('Failed to send welcome email', mailError, { userId: user.id, email: user.email });
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
        message: 'Account created successfully',
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
