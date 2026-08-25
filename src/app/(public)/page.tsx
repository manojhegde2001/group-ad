export const dynamic = 'force-dynamic';

import { FeedContainer } from '@/components/feed/feed-container';
import { HeroSection } from '@/components/home/hero-section';
import { getPostsServer } from '@/services/server/post-service';
import { auth } from '@/lib/auth';

export default async function HomePage() {
  const [initialData, session] = await Promise.all([
    getPostsServer({ limit: 12, visibility: 'PUBLIC' }),
    auth(),
  ]);

  return (
    <>
      <HeroSection initialHideHero={!!session?.user} />
      <FeedContainer initialData={initialData} showSuggestions={false} />
    </>
  );
}
