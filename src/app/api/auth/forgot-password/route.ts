import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail, passwordResetEmail, getAppBaseUrl } from '@/lib/mailer';
import crypto from 'crypto';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { forgotPasswordSchema } from '@/lib/validations/auth';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success, resetAt } = rateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000);
    if (!success) return rateLimitResponse(resetAt);

    const body = await req.json();
    const { email: rawEmail } = forgotPasswordSchema.parse(body);
    const email = rawEmail.toLowerCase();

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

    logger.info('[forgot-password] Saved reset token for', { email });

    const baseUrl = getAppBaseUrl(req);

    try {
      await sendMail({
        to: email,
        subject: 'Reset your password - Vrutta',
        html: passwordResetEmail(user.name, token, baseUrl),
      });
      logger.info('[forgot-password] sendMail call completed for', { email, baseUrl });
    } catch (mailError: any) {
      logger.error('[forgot-password] sendMail FAILED', mailError);
      return NextResponse.json({ 
        error: 'Failed to send reset email. Please try again later.',
        details: mailError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    logger.error('Forgot password error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
