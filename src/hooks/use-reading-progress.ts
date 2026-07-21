import { useEffect, useRef, useState } from "react";

// Fraction (0–1) of the document the reader has scrolled through. A dedicated
// reading-progress dependency would be overkill for a single rAF-throttled
// scroll listener, so this stays a small local hook.
export function useReadingProgress(): number {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const el = document.documentElement;
        const max = el.scrollHeight - el.clientHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return progress;
}
