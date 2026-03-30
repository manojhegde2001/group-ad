import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signupSchema } from '@/lib/validations/auth';
import { UserType } from '@prisma/client';
import { sendMail, welcomeEmail } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === validatedData.email) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
      if (existingUser.username === validatedData.username) {
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
        return NextResponse.json(
          { error: 'Selected company does not exist' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        username: validatedData.username,
        userType: validatedData.userType || UserType.INDIVIDUAL,
        companyId: validatedData.companyId || undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        userType: true,
        verificationStatus: true,
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

    // Send Welcome Email (Non-blocking but awaited before response for reliability)
    try {
      if (user.email) {
        await sendMail({
          to: user.email,
          subject: 'Welcome to Group Ad!',
          html: welcomeEmail(user.name || user.username, user.email),
        });
      }
    } catch (mailError) {
      console.error('Failed to send welcome email:', mailError);
      // We don't fail the signup if the email fails
    }

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);

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