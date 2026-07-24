// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useActiveHeading } from "@/hooks/use-active-heading";

// jsdom has no IntersectionObserver and never lays anything out, so the tests
// drive the observer callback by hand and stub getBoundingClientRect to place
// each heading on an imaginary page.
type Cb = (entries: { target: Element; isIntersecting: boolean }[]) => void;
let callback: Cb;
let observed: Element[];

beforeEach(() => {
  observed = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: Cb) {
        callback = cb;
      }
      observe(el: Element) {
        observed.push(el);
      }
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

// Renders headings and pins each one at a fixed viewport offset.
function seedHeadings(spec: { id: string; top: number }[]) {
  document.body.innerHTML = spec.map((s) => `<h2 id="${s.id}">${s.id}</h2>`).join("");
  for (const s of spec) {
    const el = document.getElementById(s.id)!;
    el.getBoundingClientRect = () => ({ top: s.top }) as DOMRect;
  }
}

const intersect = (id: string, isIntersecting: boolean) =>
  act(() => {
    callback([{ target: document.getElementById(id)!, isIntersecting }]);
  });

describe("useActiveHeading", () => {
  it("should return the heading in the band when one is intersecting", () => {
    seedHeadings([
      { id: "a", top: -500 },
      { id: "b", top: 40 },
    ]);
    const { result } = renderHook(() => useActiveHeading(["a", "b"]));

    intersect("b", true);
    expect(result.current).toBe("b");
  });

  it("should prefer the topmost heading when several are intersecting at once", () => {
    seedHeadings([
      { id: "a", top: 10 },
      { id: "b", top: 50 },
    ]);
    const { result } = renderHook(() => useActiveHeading(["a", "b"]));

    intersect("b", true);
    intersect("a", true);
    expect(result.current).toBe("a");
  });

  it("should fall back to the last heading scrolled past when none is intersecting", () => {
    // Reader is mid-section: "a" and "b" are above the fold, "c" is below.
    seedHeadings([
      { id: "a", top: -800 },
      { id: "b", top: -200 },
      { id: "c", top: 900 },
    ]);
    const { result } = renderHook(() => useActiveHeading(["a", "b", "c"]));

    intersect("b", false);
    expect(result.current).toBe("b");
  });

  it("should return null when no heading has been reached yet", () => {
    seedHeadings([{ id: "a", top: 900 }]);
    const { result } = renderHook(() => useActiveHeading(["a"]));

    intersect("a", false);
    expect(result.current).toBeNull();
  });

  it("should not observe anything when the id list is empty", () => {
    const { result } = renderHook(() => useActiveHeading([]));
    expect(result.current).toBeNull();
    expect(observed).toHaveLength(0);
  });

  it("should ignore ids with no matching element in the document", () => {
    seedHeadings([{ id: "a", top: 40 }]);
    renderHook(() => useActiveHeading(["a", "ghost"]));
    expect(observed.map((el) => el.id)).toEqual(["a"]);
  });
});
