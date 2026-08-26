import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createReportSchema } from '@/lib/validations/content';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { targetType, targetId, reason, description } = createReportSchema.parse(body);

    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetType,
        targetId,
        reason,
        description,
      },
    });

    return NextResponse.json(report);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    logger.error('Report error', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
