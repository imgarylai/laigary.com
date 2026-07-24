import { useEffect, useState } from "react";

// Id of the heading the reader is currently in, for TOC highlighting.
//
// IntersectionObserver reports *changes*, not "which is on screen now", so the
// hook keeps its own visibility set and picks the topmost visible heading from
// `ids` order. `rootMargin` pulls the top edge below the sticky header and the
// bottom edge up, leaving a band near the top of the viewport: a heading is
// "active" while it sits in that band, which matches how a reader perceives it.
//
// Falls back to the last heading scrolled past when none is in the band (i.e.
// mid-section, the common case) so the highlight never blanks out.
export function useActiveHeading(ids: readonly string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Depend on the contents, not the array identity: a caller passing an inline
  // array would otherwise tear down and rebuild the observer on every render,
  // discarding the visibility set the hook accumulates.
  const key = ids.join("\n");

  useEffect(() => {
    const ids = key === "" ? [] : key.split("\n");
    if (ids.length === 0 || typeof IntersectionObserver === "undefined") return;

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const visible = new Set<string>();

    const pick = () => {
      // Topmost visible heading in document order.
      const inBand = ids.find((id) => visible.has(id));
      if (inBand) {
        setActiveId(inBand);
        return;
      }
      // Nothing in the band — highlight the last heading above the fold.
      let last: string | null = null;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= HEADER_OFFSET) last = el.id;
        else break;
      }
      setActiveId(last);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        pick();
      },
      { rootMargin: `-${HEADER_OFFSET}px 0px -70% 0px`, threshold: 0 },
    );

    for (const el of elements) observer.observe(el);
    pick();

    return () => observer.disconnect();
  }, [key]);

  return activeId;
}

// Sticky header height (h-14 = 56px) plus a little breathing room, matching
// the `scroll-mt-*` applied to headings in terminal.css.
const HEADER_OFFSET = 72;
