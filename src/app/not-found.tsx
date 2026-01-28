import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-500 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-foreground mb-2">
            Page Not Found
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link href="/">
            <Button size="lg" className="w-full">
              Go Home
            </Button>
          </Link>
          
          <Link href="/profile">
            <Button variant="outline" size="lg" className="w-full">
              Go to Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
