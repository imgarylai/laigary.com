// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SourceView } from "@/components/admin/editor/SourceView";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

// Add the one API jsdom lacks rather than replacing `navigator` wholesale —
// same reason as CodeBlockCard.test.tsx: the dialog primitives read userAgent.
const writeText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

// Deliberately every construct the highlighter has an opinion about — a
// heading, a fence, emphasis, a quote, a bullet — so "verbatim" is asserted
// against source the tokenizer actually splits apart, not against a line of
// plain text it would hand back untouched either way.
const MARKDOWN = [
  "## 標題",
  "",
  "一段 `code` 和 **粗體**。",
  "",
  "- 項目",
  "",
  "> 引用",
  "",
  "```js",
  "const a = 1;",
  "```",
  "",
].join("\n");

afterEach(() => {
  cleanup();
  writeText.mockClear();
});

/** The source pane. */
function pre(): HTMLPreElement | null {
  return document.querySelector("pre");
}

describe("SourceView", () => {
  it("should show the markdown verbatim", () => {
    render(<SourceView markdown={MARKDOWN} />);
    // Verbatim is the whole point: this pane exists to answer "what did that
    // construct actually serialize to", so a rendered version of the source —
    // or one with its newlines collapsed — would defeat it. Hence textContent
    // rather than getByText, whose normaliser would hide exactly that. It is
    // also what pins the highlighter to painting the source rather than
    // rewriting it: every token it wraps has to put its characters back.
    expect(pre()?.textContent).toBe(MARKDOWN);
  });

  it("should colour the markdown constructs it is showing", () => {
    // Unhighlighted markdown is a wall of punctuation, which is what made the
    // old panel hard to read. The classes are the site's own hljs theme.
    render(<SourceView markdown={MARKDOWN} />);

    expect(document.querySelector(".hljs-section")?.textContent).toBe("## 標題");
    expect(document.querySelector(".hljs-strong")?.textContent).toBe("**粗體**");
    expect(document.querySelector(".hljs-quote")?.textContent).toBe("> 引用");
  });

  it("should leave a fenced block as markdown source rather than highlighting inside it", () => {
    // The fence is one `code` token, JavaScript and all: this pane shows the
    // document as markdown. Highlighting the fence body would mean two answers
    // on screen to "what is stored here".
    render(<SourceView markdown={MARKDOWN} />);

    const fence = [...document.querySelectorAll(".hljs-code")].find((el) =>
      el.textContent?.startsWith("```js"),
    );
    expect(fence?.textContent).toBe("```js\nconst a = 1;\n```");
  });

  it("should copy the markdown it is showing", async () => {
    render(<SourceView markdown={MARKDOWN} />);

    fireEvent.click(screen.getByRole("button", { name: "editor.codeCopy" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(MARKDOWN));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "editor.codeCopied" })).toBeTruthy(),
    );
  });

  it("should go back to offering a copy after the confirmation times out", async () => {
    // A button stuck reading "copied" claims the next document was copied too.
    // The reset is on a 1.5s timer, so the clock is faked from before the click.
    render(<SourceView markdown={MARKDOWN} />);
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
