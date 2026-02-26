import { CategoryBar } from '@/components/feed/category-bar';
import { FeedContainer } from '@/components/feed/feed-container';
import { HeroSection } from '@/components/home/hero-section';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoryBar />
      <FeedContainer />
    </>
  );
}
