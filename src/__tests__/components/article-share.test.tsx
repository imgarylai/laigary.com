// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ArticleShare } from "@/features/public-site/ArticleShare";
import { I18nProvider } from "@/i18n/I18nProvider";

const url = "https://laigary.com/posts/editor-notes";
const title = "十年 & editors #1?";
function clipboard(value: unknown) {
  vi.stubGlobal("navigator", Object.create(navigator, { clipboard: { value } }));
}
function show() {
  return render(
    <I18nProvider initialLocale="en">
      <ArticleShare title={title} url={url} />
    </I18nProvider>,
  );
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ArticleShare", () => {
  it("should preserve title punctuation and the canonical URL when sharing on X", () => {
    show();
    const link = screen.getByRole("link", { name: /Share on X/ });
    const intent = new URL(link.getAttribute("href")!);
    expect(intent.origin + intent.pathname).toBe("https://x.com/intent/tweet");
    expect(intent.searchParams.get("text")).toBe(title);
    expect(intent.searchParams.get("url")).toBe(url);
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("should copy the canonical URL and announce success when copying succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard({ writeText });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByRole("button", { name: "Copied" })).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(url);
    expect(screen.getByRole("status").textContent).toBe("Link copied. Ready to share.");
  });

  it("should offer a selectable link when clipboard access is denied", async () => {
    clipboard({ writeText: vi.fn().mockRejectedValue(new Error("Denied")) });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    const input = (await screen.findByRole("textbox", {
      name: "Article link",
    })) as HTMLInputElement;
    expect(input.value).toBe(url);
    fireEvent.focus(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(url.length);
    expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
  });

  it("should offer a manual copy when the Clipboard API is unavailable", async () => {
    clipboard(undefined);
    show();
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByRole("textbox", { name: "Article link" })).toBeTruthy();
  });
});
