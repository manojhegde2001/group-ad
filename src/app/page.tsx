import { FeedContainer } from '@/components/feed/feed-container';
import { Title, Text, Button } from 'rizzui';
import { TrendingUp, Users, Calendar, BarChart } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary-50 to-primary/5 dark:from-primary/5 dark:via-secondary-900 dark:to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Title className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-700 bg-clip-text text-transparent">
              Connect. Collaborate. Grow.
            </Title>
            <Text className="text-xl text-secondary-600 dark:text-secondary-400 mb-8 max-w-2xl mx-auto">
              Join the premier business networking platform where professionals and enterprises connect, share insights, and build meaningful relationships.
            </Text>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary-600">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16 max-w-6xl mx-auto">
            {[
              { icon: TrendingUp, title: 'Grow Your Network', desc: 'Connect with industry leaders' },
              { icon: Users, title: 'Business Connections', desc: 'Build meaningful relationships' },
              { icon: Calendar, title: 'Events & Meetings', desc: 'Join virtual & physical events' },
              { icon: BarChart, title: 'Analytics & Insights', desc: 'Track your growth' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <Text className="font-semibold mb-2">{feature.title}</Text>
                <Text className="text-sm text-secondary-600 dark:text-secondary-400">{feature.desc}</Text>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feed Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Title className="text-3xl font-bold mb-2">Discover Trending Content</Title>
            <Text className="text-secondary-600 dark:text-secondary-400">
              Explore posts from businesses and professionals worldwide
            </Text>
          </div>

          <FeedContainer />
        </div>
      </section>
    </div>
  );
}
