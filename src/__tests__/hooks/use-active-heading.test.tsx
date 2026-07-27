// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useActiveHeading } from "@/hooks/use-active-heading";

// Run the rAF throttle synchronously so scroll events resolve immediately,
// matching the use-reading-progress harness.
beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

// Document scroll geometry; the default leaves plenty of room below the fold
// so tests opt in to the at-the-bottom behaviour explicitly.
function setScroll({ scrollTop = 0, clientHeight = 800, scrollHeight = 5000 } = {}) {
  const el = document.documentElement;
  for (const [k, value] of Object.entries({ scrollTop, clientHeight, scrollHeight })) {
    Object.defineProperty(el, k, { value, configurable: true });
  }
}

beforeEach(() => setScroll());

// jsdom lays nothing out, so each heading is pinned at a chosen viewport offset.
function seedHeadings(spec: { id: string; top: number }[]) {
  document.body.innerHTML = spec.map((s) => `<h2 id="${s.id}">${s.id}</h2>`).join("");
  for (const s of spec) place(document.getElementById(s.id)!, s.top);
}

function place(el: HTMLElement, top: number) {
  el.getBoundingClientRect = () => ({ top }) as DOMRect;
}

const scroll = () => act(() => void window.dispatchEvent(new Event("scroll")));

describe("useActiveHeading", () => {
  it("should return null when the reader is above the first heading", () => {
    seedHeadings([{ id: "a", top: 400 }]);
    const { result } = renderHook(() => useActiveHeading(["a"]));
    expect(result.current).toBeNull();
  });

  it("should return the heading once it reaches the header offset", () => {
    seedHeadings([
      { id: "a", top: 72 },
      { id: "b", top: 600 },
    ]);
    const { result } = renderHook(() => useActiveHeading(["a", "b"]));
    expect(result.current).toBe("a");
  });

  it("should track the last heading scrolled past as the reader moves down", () => {
    seedHeadings([
      { id: "a", top: -800 },
      { id: "b", top: -200 },
      { id: "c", top: 900 },
    ]);
    const { result } = renderHook(() => useActiveHeading(["a", "b", "c"]));
    expect(result.current).toBe("b");

    // Scroll far enough that "c" is above the fold too.
    place(document.getElementById("c")!, -50);
    scroll();
    expect(result.current).toBe("c");
  });

  it("should resample on hashchange since an anchor jump may not emit a scroll", () => {
    seedHeadings([
      { id: "a", top: 400 },
      { id: "b", top: 900 },
    ]);
    const { result } = renderHook(() => useActiveHeading(["a", "b"]));
    expect(result.current).toBeNull();

    place(document.getElementById("a")!, 72);
    act(() => void window.dispatchEvent(new Event("hashchange")));
    expect(result.current).toBe("a");
  });

  // Regression: clicking a TOC entry navigates by hash, which re-renders the
  // article. A hook holding cached element references would then be reading
  // detached nodes, whose rects are all zero — every heading looks "scrolled
  // past" and the *last* entry lights up while scrolling stops updating.
  it("should stay correct after the article dom is replaced", () => {
    seedHeadings([
      { id: "a", top: -300 },
      { id: "b", top: 200 },
      { id: "c", top: 800 },
    ]);
    const { result } = renderHook(() => useActiveHeading(["a", "b", "c"]));
    expect(result.current).toBe("a");

    // Re-render the article: same ids, brand new element objects.
    seedHeadings([
      { id: "a", top: -900 },
      { id: "b", top: 72 },
      { id: "c", top: 700 },
    ]);
    scroll();
    expect(result.current).toBe("b");
  });

  // A short final section never reaches the header offset, so its entry would
  // never light up — clicking the last TOC row would highlight the one before.
  it("should activate the last visible heading once the page is scrolled to the bottom", () => {
    seedHeadings([
      { id: "a", top: -900 },
      { id: "b", top: -400 },
      { id: "c", top: 500 },
    ]);
    const { result } = renderHook(() => useActiveHeading(["a", "b", "c"]));
    expect(result.current).toBe("b");

    setScroll({ scrollTop: 4200, clientHeight: 800, scrollHeight: 5000 });
    scroll();
    expect(result.current).toBe("c");
  });

  it("should not widen the threshold while there is still page left to scroll", () => {
    seedHeadings([
      { id: "a", top: -400 },
      { id: "b", top: 500 },
    ]);
    setScroll({ scrollTop: 1000, clientHeight: 800, scrollHeight: 5000 });
    const { result } = renderHook(() => useActiveHeading(["a", "b"]));
    expect(result.current).toBe("a");
  });

  it("should ignore a heading that is no longer in the document", () => {
    seedHeadings([
      { id: "a", top: -100 },
      { id: "b", top: -50 },
    ]);
    const stale = document.getElementById("b")!;
    stale.remove();
    // A detached node reports top 0, which would otherwise read as active.
    place(stale, 0);

    const { result } = renderHook(() => useActiveHeading(["a", "b"]));
    expect(result.current).toBe("a");
  });

  it("should not subscribe when the id list is empty", () => {
    const spy = vi.spyOn(window, "addEventListener");
    try {
      const { result } = renderHook(() => useActiveHeading([]));
      expect(result.current).toBeNull();
      expect(spy.mock.calls.some(([type]) => type === "scroll")).toBe(false);
    } finally {
      // The cleanup test below drives real scroll listeners. Left installed,
      // this spy would still call through today — but it is one behaviour
      // change away from making that test pass against a stub.
      spy.mockRestore();
    }
  });

  it("should stay idle when none of the ids resolve to an element", () => {
    const { result } = renderHook(() => useActiveHeading(["ghost", "phantom"]));
    expect(result.current).toBeNull();
  });

  it("should stop sampling once unmounted", () => {
    seedHeadings([{ id: "a", top: 400 }]);
    const { result, unmount } = renderHook(() => useActiveHeading(["a"]));
    unmount();

    place(document.getElementById("a")!, -10);
    scroll();
    expect(result.current).toBeNull();
  });
});
