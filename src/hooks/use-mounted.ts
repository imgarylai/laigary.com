import { useEffect, useState } from "react";

/**
 * False during the server render and the hydrating one, true from the next
 * render on.
 *
 * For values that are only knowable in the browser — anything read off the
 * reader's clock or timezone. The admin runs through SSR like every other
 * route, and the Worker's zone is UTC, so formatting a timestamp during that
 * pass produces a string the hydrating browser would not have produced. Gating
 * on this keeps the first client render identical to the server's and lets the
 * real value land one render later, instead of hydrating over markup React did
 * not write.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
