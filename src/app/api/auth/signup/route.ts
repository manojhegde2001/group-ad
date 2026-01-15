import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, username, category, userType, companyName, turnover, companySize, industry } = body;

    if (!email || !password || !name || !username || !category) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract string values from Select component objects
    const categoryValue = typeof category === 'object' ? category.value : category;
    const turnoverValue = typeof turnover === 'object' ? turnover?.value : turnover;
    const companySizeValue = typeof companySize === 'object' ? companySize?.value : companySize;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email or username already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        username,
        category: categoryValue,
        userType: userType || 'INDIVIDUAL',
        companyName: userType === 'BUSINESS' ? companyName : undefined,
        turnover: userType === 'BUSINESS' ? turnoverValue : undefined,
        companySize: userType === 'BUSINESS' ? companySizeValue : undefined,
        industry: userType === 'BUSINESS' ? industry : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        userType: true,
        visibility: true,
        category: true,
        companyName: true,
      },
    });

    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      message: 'Signup successful',
      user,
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
