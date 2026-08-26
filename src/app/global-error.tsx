'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Root application error', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              We&apos;re sorry for the inconvenience. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: 6,
                border: 'none',
                background: '#111827',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
