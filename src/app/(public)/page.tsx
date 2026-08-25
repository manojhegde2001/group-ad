export const dynamic = 'force-dynamic';

import { FeedContainer } from '@/components/feed/feed-container';
import { HeroSection } from '@/components/home/hero-section';
import { getPostsServer } from '@/services/server/post-service';

export default async function HomePage() {
  const initialData = await getPostsServer({ limit: 12, visibility: 'PUBLIC' });

  return (
    <>
      <HeroSection />
      <FeedContainer initialData={initialData} showSuggestions={false} />
    </>
  );
}
