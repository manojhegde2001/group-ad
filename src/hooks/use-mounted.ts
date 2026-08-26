import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * True once the component has hydrated on the client, false during SSR and
 * the first client render. Use to gate client-only rendering (e.g. reading
 * localStorage/theme) without a hydration mismatch — safer than the
 * `useState(false) + useEffect(() => setState(true))` pattern, which trips
 * React's "don't setState synchronously in an effect" rule.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
