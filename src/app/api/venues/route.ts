import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/venues - Public endpoint to fetch venues
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    const where = city ? { city: { contains: city, mode: 'insensitive' as const } } : {};

    const venues = await prisma.venue.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      // Since venues don't have images in the schema yet, 
      // we might want to return some placeholder color or metadata if needed
    });

    return NextResponse.json({
      venues,
      count: venues.length,
    });
  } catch (error) {
    console.error('Error fetching venues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}
