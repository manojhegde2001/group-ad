import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendMail, verificationEmail, getAppBaseUrl } from '@/lib/mailer';
import { logger } from '@/lib/logger';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { resendVerificationSchema } from '@/lib/validations/auth';

/**
 * POST /api/auth/resend-verification  { email }
 *
 * Issues a fresh verification link. Always returns the same generic response so
 * the endpoint can't be used to probe which emails are registered or verified.
 */
export async function POST(request: NextRequest) {
  const generic = NextResponse.json({
    message: 'If that account exists and still needs verification, a new link has been sent.',
  });

  try {
    const ip = getClientIp(request);
    const { success, resetAt } = rateLimit(`resend-verification:${ip}`, 5, 60 * 60 * 1000);
    if (!success) return rateLimitResponse(resetAt);

    const body = await request.json();
    const { email: rawEmail } = resendVerificationSchema.parse(body);
    const email = rawEmail.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });

    // Only act for a genuine unverified signup — one that already has a pending
    // token. No user, an already-verified user, or a legacy account (no token,
    // treated as verified) all get the same generic response and no change, so
    // we never issue a token that would lock a legacy user out of sign-in.
    if (!user || user.emailVerified || !user.emailVerificationToken) {
      return generic;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    const baseUrl = getAppBaseUrl(request);

    try {
      if (user.email) {
        await sendMail({
          to: user.email,
          subject: 'Verify your email - Vrutta',
          html: verificationEmail(user.name || user.username, verificationToken, baseUrl),
        });
      }
    } catch (mailError) {
      logger.error('Failed to resend verification email', mailError, { userId: user.id });
    }

    return generic;
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    logger.error('Resend verification error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
