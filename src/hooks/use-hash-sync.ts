import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";

// Keeps the URL hash pointing at the section being read, so copying the
// address bar mid-article shares the spot rather than the top of the page.
//
// Goes through the router rather than `history.replaceState`: TanStack patches
// the native method and notifies its subscribers either way, so a raw call
// would still drive a router update — just one we could not pass options to.
// Navigating explicitly lets both scroll behaviours be switched off, which
// matters because this fires *while the reader is scrolling*:
//   - resetScroll would yank the page back to the top
//   - hashScrollIntoView would re-scroll to the heading we only just passed
//
// `replace` keeps it out of the history stack: pushing every section would
// leave the back button needing one press per heading to escape the article.
export function useHashSync(activeId: string | null): void {
  const router = useRouter();
  // The hash we last wrote, so a section the reader lingers in is not
  // re-navigated on every sample.
  const written = useRef<string | null>(null);

  useEffect(() => {
    if (written.current === activeId) return;
    written.current = activeId;

    void router.navigate({
      hash: activeId ?? undefined,
      replace: true,
      resetScroll: false,
      hashScrollIntoView: false,
    });
  }, [activeId, router]);
}
