// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useHashSync } from "@/hooks/use-hash-sync";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ navigate }),
}));

beforeEach(() => navigate.mockClear());
afterEach(cleanup);

describe("useHashSync", () => {
  it("should write the active heading to the hash when it changes", () => {
    const { rerender } = renderHook(({ id }) => useHashSync(id), {
      initialProps: { id: null as string | null },
    });
    navigate.mockClear();

    rerender({ id: "剪枝" });
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ hash: "剪枝" }));
  });

  it("should replace rather than push so the back button still leaves the article", () => {
    renderHook(() => useHashSync("a"));
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ replace: true }));
  });

  // This runs mid-scroll, so either scroll behaviour would fight the reader:
  // one yanks to the top, the other re-scrolls to the heading just passed.
  it("should disable both scroll behaviours since it fires while scrolling", () => {
    renderHook(() => useHashSync("a"));
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ resetScroll: false, hashScrollIntoView: false }),
    );
  });

  it("should not navigate again while the reader stays in the same section", () => {
    const { rerender } = renderHook(({ id }) => useHashSync(id), {
      initialProps: { id: "a" as string | null },
    });
    expect(navigate).toHaveBeenCalledTimes(1);

    rerender({ id: "a" });
    rerender({ id: "a" });
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("should clear the hash when the reader scrolls back above the first heading", () => {
    const { rerender } = renderHook(({ id }) => useHashSync(id), {
      initialProps: { id: "a" as string | null },
    });
    navigate.mockClear();

    rerender({ id: null });
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ hash: undefined }));
  });

  it("should follow the reader from one section to the next", () => {
    const { rerender } = renderHook(({ id }) => useHashSync(id), {
      initialProps: { id: "a" as string | null },
    });
    rerender({ id: "b" });
    rerender({ id: "c" });

    expect(navigate.mock.calls.map(([opts]) => opts.hash)).toEqual(["a", "b", "c"]);
  });
});
