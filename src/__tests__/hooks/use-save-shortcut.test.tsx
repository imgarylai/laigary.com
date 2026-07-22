// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useSaveShortcut } from "@/hooks/use-save-shortcut";

afterEach(cleanup);

function press(key: string, mods: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent("keydown", { key, cancelable: true, ...mods });
  window.dispatchEvent(event);
  return event;
}

describe("useSaveShortcut", () => {
  it("fires onSave and prevents the browser dialog on Cmd/Ctrl+S", () => {
    const onSave = vi.fn();
    renderHook(() => useSaveShortcut(onSave));

    const cmd = press("s", { metaKey: true });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(cmd.defaultPrevented).toBe(true);

    press("S", { ctrlKey: true });
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it("ignores plain s and other modified keys", () => {
    const onSave = vi.fn();
    renderHook(() => useSaveShortcut(onSave));
    press("s");
    press("k", { metaKey: true });
    expect(onSave).not.toHaveBeenCalled();
  });

  it("removes the listener on unmount", () => {
    const onSave = vi.fn();
    const { unmount } = renderHook(() => useSaveShortcut(onSave));
    unmount();
    press("s", { metaKey: true });
    expect(onSave).not.toHaveBeenCalled();
  });
});
