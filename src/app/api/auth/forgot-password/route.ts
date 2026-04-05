import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail, passwordResetEmail } from '@/lib/mailer';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // We don't want to reveal if a user exists or not for security reasons
    if (!user) {
      return NextResponse.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    await sendMail({
      to: email,
      subject: 'Reset your password - Group Ad',
      html: passwordResetEmail(user.name, token),
    });

    return NextResponse.json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
