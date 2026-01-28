'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-primary-500 mb-4">Oops!</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400">
            We're sorry for the inconvenience. Please try again.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={reset}
            size="lg"
            className="w-full"
          >
            Try Again
          </Button>
          
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Go Home
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-secondary-500">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-4 p-4 bg-secondary-100 dark:bg-secondary-800 rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
