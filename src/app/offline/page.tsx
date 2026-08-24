import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'You\'re offline',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-secondary-900">You&apos;re offline</h1>
      <p className="max-w-sm text-secondary-500">
        This page isn&apos;t available without an internet connection. Reconnect and try again.
      </p>
    </div>
  );
}
