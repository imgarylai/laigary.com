// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useReadingProgress } from "@/hooks/use-reading-progress";

// Run the rAF throttle synchronously so scroll events resolve immediately.
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
});

function setScroll({ scrollHeight = 0, clientHeight = 0, scrollTop = 0 }) {
  const el = document.documentElement;
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: clientHeight, configurable: true });
  Object.defineProperty(el, "scrollTop", { value: scrollTop, configurable: true });
}

describe("useReadingProgress", () => {
  it("stays 0 when the content fits the viewport", () => {
    setScroll({ scrollHeight: 500, clientHeight: 800, scrollTop: 0 });
    const { result } = renderHook(() => useReadingProgress());
    expect(result.current).toBe(0);
  });

  it("reports the scrolled fraction and clamps at 1", () => {
    setScroll({ scrollHeight: 2000, clientHeight: 1000, scrollTop: 500 });
    const { result } = renderHook(() => useReadingProgress());
    expect(result.current).toBe(0.5);

    act(() => {
      setScroll({ scrollHeight: 2000, clientHeight: 1000, scrollTop: 1500 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(1);
  });
});
