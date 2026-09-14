'use client';

import { useState } from 'react';

/**
 * Masonic caches cell positions by index and assumes the `items` array only
 * ever grows (append-only). When it shrinks — the last page is reached and
 * trailing loader skeletons are removed, a refetch drops a post, an item is
 * deleted — masonic reads past the new end and its `itemKey`/render throws
 * "Cannot read properties of undefined".
 *
 * This returns a key string that changes on every shrink, so `<Masonry>`
 * remounts cleanly instead of crashing. The generation resets whenever the
 * base key changes (e.g. a new filter), since that already forces a remount.
 *
 * Uses the React "adjust state while rendering" pattern to track the previous
 * item count without an effect, so the new key is available on the same render
 * that the shrink happens.
 */
export function useMasonryRemountKey(baseKey: string, itemCount: number): string {
  const [prev, setPrev] = useState({ baseKey, count: itemCount, generation: 0 });

  let next = prev;
  if (prev.baseKey !== baseKey) {
    next = { baseKey, count: itemCount, generation: 0 };
  } else if (itemCount < prev.count) {
    next = { baseKey, count: itemCount, generation: prev.generation + 1 };
  } else if (itemCount > prev.count) {
    next = { baseKey, count: itemCount, generation: prev.generation };
  }

  if (next !== prev) {
    setPrev(next);
  }

  return `${next.baseKey}|g${next.generation}`;
}
