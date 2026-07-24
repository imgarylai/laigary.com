import { useEffect, useState } from "react";

// Id of the heading the reader is currently in, for TOC highlighting: the last
// heading scrolled past, or null while still above the first one.
//
// Deliberately re-queries the DOM on every sample instead of caching element
// references. Something in the hash-navigation path — the router re-rendering
// the article, most likely — swaps the heading nodes, and a cached reference
// then points at a detached element. Detached nodes report a zero rect, which
// reads as "scrolled past": every entry qualified and the *last* one lit up,
// while the observer went on watching dead nodes so scrolling stopped
// updating. Re-querying is correct however often the article DOM is replaced,
// which is why it is preferred here over pinning down the exact trigger.
//
// A rAF-throttled scroll listener rather than IntersectionObserver, matching
// use-reading-progress: the sample is a handful of getBoundingClientRect calls
// (one per heading, ~20 at most) and it cannot go stale.
export function useActiveHeading(ids: readonly string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Depend on the contents, not the array identity, so a caller passing an
  // inline array does not re-subscribe on every render.
  const key = ids.join("\n");

  useEffect(() => {
    const ids = key === "" ? [] : key.split("\n");
    if (ids.length === 0) return;

    let frame = 0;

    const sample = () => {
      const doc = document.documentElement;
      // The last section can be too short to ever reach the header offset, so
      // its entry would never light up. Once the page is scrolled to the
      // bottom nothing further can come into view — widen the threshold to the
      // whole viewport so the final heading on screen wins.
      const atBottom = doc.scrollTop + doc.clientHeight >= doc.scrollHeight - BOTTOM_EPSILON;
      const limit = atBottom ? doc.clientHeight : HEADER_OFFSET;

      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        // isConnected guards the same failure the re-query prevents: a node
        // held elsewhere but no longer in the document reports top === 0.
        if (!el?.isConnected) continue;
        if (el.getBoundingClientRect().top <= limit) current = id;
        else break;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sample);
    };

    sample();
    window.addEventListener("scroll", onScroll, { passive: true });
    // Anchor clicks jump without always emitting a scroll event (an in-view
    // target, or a jump the router handles), so resample on hash change too.
    window.addEventListener("hashchange", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [key]);

  return activeId;
}

// Sticky header height (h-14 = 56px) plus breathing room, matching the
// `scroll-margin-top` applied to headings in terminal.css. A heading parked by
// an anchor jump sits exactly at this offset, so the comparison is inclusive.
const HEADER_OFFSET = 72;

// Sub-pixel slack: fractional scroll positions and zoom mean scrollTop +
// clientHeight rarely lands exactly on scrollHeight at the bottom.
const BOTTOM_EPSILON = 2;
