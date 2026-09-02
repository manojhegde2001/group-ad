'use client';

import { useSyncExternalStore } from 'react';

export const WAS_AUTH_KEY = 'vrutta.authed';

const subscribe = (onChange: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};

const getSnapshot = () => {
  try {
    return localStorage.getItem(WAS_AUTH_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * True if this browser has previously held an authenticated session (a flag
 * written by LayoutContent once next-auth confirms one, cleared on sign-out).
 *
 * It lets the app paint the logged-in chrome/skeleton on a hard refresh
 * *before* `useSession()` re-confirms, without any server round-trip or
 * dynamic rendering. The server snapshot is always `false`, so SSR output
 * and logged-out visitors are unaffected.
 */
export function useWasAuthenticated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
