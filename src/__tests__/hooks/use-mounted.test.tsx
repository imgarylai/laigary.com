// @vitest-environment jsdom
//
// The gate that keeps clock- and timezone-dependent formatting out of the SSR
// pass. It has to report false on the FIRST render and true afterwards — a hook
// that simply returned true would satisfy every later assertion while producing
// exactly the hydration mismatch it exists to prevent.

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMounted } from "@/hooks/use-mounted";

describe("useMounted", () => {
  it("should report false on the first render and true once the effect has run", () => {
    const seen: boolean[] = [];
    const { result } = renderHook(() => {
      const mounted = useMounted();
      seen.push(mounted);
      return mounted;
    });

    // renderHook runs effects, so the final value is the mounted one — but the
    // first render, the one whose output the server has to match, was not.
    expect(seen[0]).toBe(false);
    expect(result.current).toBe(true);
  });
});
