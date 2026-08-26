import { NextRequest, NextResponse } from 'next/server';
import { getTrendingTagsServer } from '@/services/server/tag-service';
import { logger } from '@/lib/logger';

// GET /api/tags/trending - Fetch trending hashtags aggregated from post tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    const tags = await getTrendingTagsServer(limit);
    return NextResponse.json({ tags });
  } catch (error) {
    logger.error('Error fetching trending tags API', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending tags' },
      { status: 500 }
    );
  }
}
