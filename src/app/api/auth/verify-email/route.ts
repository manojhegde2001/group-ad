import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail, welcomeEmail, getAppBaseUrl } from '@/lib/mailer';
import { logger } from '@/lib/logger';

/**
 * GET /api/auth/verify-email?token=…
 *
 * Clicked from the verification email. Marks the account verified, clears the
 * token, sends the welcome email, then redirects back to the verify-email page
 * with a status flag it renders as success / expired / invalid.
 */
export async function GET(request: NextRequest) {
  const baseUrl = getAppBaseUrl(request);
  const token = request.nextUrl.searchParams.get('token');

  const redirectTo = (status: string) =>
    NextResponse.redirect(new URL(`/auth/verify-email?verified=${status}`, baseUrl));

  if (!token) {
    return redirectTo('invalid');
  }

  try {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return redirectTo('invalid');
    }

    // Already verified (e.g. the link was clicked twice) — treat as success.
    if (user.emailVerified) {
      return redirectTo('already');
    }

    if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
      return redirectTo('expired');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    logger.info('Email verified', { userId: user.id });

    if (user.email) {
      try {
        await sendMail({
          to: user.email,
          subject: 'Welcome to Vrutta!',
          html: welcomeEmail(user.name || user.username, user.email, baseUrl),
        });
      } catch (mailError) {
        logger.error('Failed to send welcome email after verification', mailError, { userId: user.id });
      }
    }

    return redirectTo('success');
  } catch (error) {
    logger.error('Email verification error', error);
    return redirectTo('error');
  }
}
