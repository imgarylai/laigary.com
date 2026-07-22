// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

type Listener = () => void;
let mqlChange: Listener | null = null;

beforeEach(() => {
  // jsdom has no matchMedia; the hook only uses the change subscription.
  vi.stubGlobal("matchMedia", () => ({
    addEventListener: (_: string, cb: Listener) => (mqlChange = cb),
    removeEventListener: () => (mqlChange = null),
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
}

describe("useIsMobile", () => {
  it("is false at desktop widths and true below the breakpoint", () => {
    setWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      setWidth(500);
      mqlChange?.();
    });
    expect(result.current).toBe(true);
  });
});
