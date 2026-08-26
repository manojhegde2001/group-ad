import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    logger.error('Session error', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
