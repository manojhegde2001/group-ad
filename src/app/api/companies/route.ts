import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/companies - Fetch all companies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verified = searchParams.get('verified');

    const where = verified === 'true' ? { isVerified: true } : {};

    const companies = await prisma.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        industry: true,
        location: true,
        isVerified: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: [
        { isVerified: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      companies,
      count: companies.length,
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}