import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { resetPasswordSchema } from '@/lib/validations/auth';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success, resetAt } = rateLimit(`reset-password:${ip}`, 10, 60 * 60 * 1000);
    if (!success) return rateLimitResponse(resetAt);

    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    logger.error('Reset password error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
