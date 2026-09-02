'use client';

import { useEffect, useState } from 'react';

/** Ordered [minWidthExclusive, columns] pairs, checked high-to-low. */
export type ColumnThresholds = ReadonlyArray<readonly [number, number]>;

// Feed: matches the historical react-masonry-css breakpoints
// (≤768 → 2 · ≤1280 → 3 · ≤1536 → 4 · larger → 5).
export const FEED_COLUMNS: ColumnThresholds = [[1536, 5], [1280, 4], [768, 3]];

// Profile: 4 columns already kick in at >1024 (≤1024 → 3 · ≤1536 → 4).
export const PROFILE_COLUMNS: ColumnThresholds = [[1536, 5], [1024, 4], [768, 3]];

/**
 * Responsive masonry column count. Starts at `min` on the server / first
 * paint to avoid a hydration mismatch, then tracks window width.
 */
export function useColumnCount(thresholds: ColumnThresholds = FEED_COLUMNS, min = 2): number {
  const [count, setCount] = useState(min);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      for (const [minWidth, cols] of thresholds) {
        if (w > minWidth) return cols;
      }
      return min;
    };

    const update = () => setCount(compute());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
    // thresholds/min are module-level constants in practice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return count;
}
