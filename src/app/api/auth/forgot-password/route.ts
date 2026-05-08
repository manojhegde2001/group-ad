import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail, passwordResetEmail } from '@/lib/mailer';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email: rawEmail } = await req.json();
    const email = rawEmail?.toLowerCase();

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

    console.log('[forgot-password] Saved reset token for', email);

    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    try {
      await sendMail({
        to: email,
        subject: 'Reset your password - Vrutta',
        html: passwordResetEmail(user.name, token, baseUrl),
      });
      console.log('[forgot-password] sendMail call completed for', email, 'with baseUrl:', baseUrl);
    } catch (mailError: any) {
      console.error('[forgot-password] sendMail FAILED:', mailError);
      return NextResponse.json({ 
        error: 'Failed to send reset email. Please try again later.',
        details: mailError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
