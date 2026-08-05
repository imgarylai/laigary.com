// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SourceSheet } from "@/components/admin/editor/SourceSheet";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

// Add the one API jsdom lacks rather than replacing `navigator` wholesale —
// same reason as CodeBlockCard.test.tsx: the dialog primitives read userAgent.
const writeText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

const MARKDOWN = "## 標題\n\n一段 `code` 和 **粗體**。\n";

afterEach(() => {
  cleanup();
  writeText.mockClear();
});

/** The source pane. Queried out of the document because the sheet portals. */
function pre(): HTMLPreElement | null {
  return document.querySelector("pre");
}

describe("SourceSheet", () => {
  it("should show the markdown verbatim", () => {
    render(<SourceSheet markdown={MARKDOWN} open onOpenChange={() => {}} />);
    // Verbatim is the whole point: this panel exists to answer "what did that
    // construct actually serialize to", so a rendered version of the source —
    // or one with its newlines collapsed — would defeat it. Hence textContent
    // rather than getByText, whose normaliser would hide exactly that.
    expect(pre()?.textContent).toBe(MARKDOWN);
  });

  it("should stay closed until asked", () => {
    render(<SourceSheet markdown={MARKDOWN} open={false} onOpenChange={() => {}} />);
    expect(pre()).toBeNull();
  });

  it("should copy the markdown it is showing", async () => {
    render(<SourceSheet markdown={MARKDOWN} open onOpenChange={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "editor.codeCopy" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(MARKDOWN));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "editor.codeCopied" })).toBeTruthy(),
    );
  });

  it("should go back to offering a copy after the confirmation times out", async () => {
    // A button stuck reading "copied" claims the next document was copied too.
    // The reset is on a 1.5s timer, so the clock is faked from before the click.
    render(<SourceSheet markdown={MARKDOWN} open onOpenChange={() => {}} />);
    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole("button", { name: "editor.codeCopy" }));
      // Settles the clipboard promise without moving the clock.
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(screen.getByRole("button", { name: "editor.codeCopied" })).toBeTruthy();

      await act(() => vi.advanceTimersByTimeAsync(2000));

      expect(screen.getByRole("button", { name: "editor.codeCopy" })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
