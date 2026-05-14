import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesServer } from '@/services/server/category-service';

// GET /api/categories - Fetch all active categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      active: searchParams.get('active') !== 'false',
      trending: searchParams.get('trending') === 'true',
    };

    const result = await getCategoriesServer(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching categories API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}