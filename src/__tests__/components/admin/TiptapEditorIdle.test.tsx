// @vitest-environment jsdom
//
// The editor schedules its markdown preview on `requestIdleCallback` so a long
// document does not render between keystrokes (#175) — and falls back to a
// timeout on Safari <18, which is also what jsdom gives it. That fallback is
// what every other test in this suite exercises, so the NATIVE path had no
// coverage at all: the two branches are picked at module load, so the choice is
// frozen by the time any test can stub anything.
//
// Hence a file of its own. The stubs go in before the module is imported, which
// is the only moment that decision is made.

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

vi.mock("@/lib/markdown", () => ({
  renderMarkdown: vi.fn(async (md: string) => `<p data-rendered>${md}</p>`),
}));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

const idle = vi.hoisted(() => ({ request: vi.fn(), cancel: vi.fn() }));

// Run the callback on a macrotask, the way the browser would — synchronously
// here would fire it during render.
vi.stubGlobal("requestIdleCallback", (cb: () => void) => {
  idle.request();
  return window.setTimeout(cb, 0);
});
vi.stubGlobal("cancelIdleCallback", (handle: number) => {
  idle.cancel();
  window.clearTimeout(handle);
});

// Imported AFTER the stubs, so the module sees a window that has both.
const { default: TiptapEditorImpl } = await import("@/components/admin/TiptapEditorImpl");

afterEach(cleanup);

describe("TiptapEditorImpl idle scheduling", () => {
  it("schedules the preview render through requestIdleCallback when the browser has one", async () => {
    render(<TiptapEditorImpl value="# Hello" showPreview onChange={() => {}} />);

    // The preview arriving is the proof the scheduled work actually ran; the
    // counter is the proof it went through the native API to get there.
    await waitFor(() => expect(document.querySelector("[data-rendered]")).toBeTruthy());
    expect(idle.request).toHaveBeenCalled();
  });

  it("releases the idle handle when the editor goes away", async () => {
    // The handle is only taken once the 300ms debounce fires, so wait for the
    // preview before unmounting — otherwise there is nothing to release yet and
    // the assertion would pass or fail on timing rather than on the cleanup.
    const { unmount } = render(
      <TiptapEditorImpl value="# Hello" showPreview onChange={() => {}} />,
    );
    await waitFor(() => expect(document.querySelector("[data-rendered]")).toBeTruthy());

    unmount();

    expect(idle.cancel).toHaveBeenCalled();
  });
});
