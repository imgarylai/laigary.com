// @vitest-environment jsdom
//
// The editor's YouTube embed dialog, reached from the toolbar and `/youtube`.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { Editor } from "@tiptap/react";
import { YouTubeDialog } from "@/components/admin/editor/YouTubeDialog";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

function renderDialog() {
  const setYoutubeVideo = vi.fn(() => ({ run: vi.fn() }));
  const editor = {
    chain: () => ({ focus: () => ({ setYoutubeVideo }) }),
  } as unknown as Editor;
  const onOpenChange = vi.fn();
  render(<YouTubeDialog editor={editor} open onOpenChange={onOpenChange} />);
  return { setYoutubeVideo, onOpenChange };
}

const urlBox = () => screen.getByPlaceholderText("editor.youtubeUrlPlaceholder");
const embedButton = () => screen.getByRole("button", { name: "editor.embed" });

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("YouTubeDialog", () => {
  it("should refuse to embed until a URL is entered", () => {
    renderDialog();

    expect(embedButton().hasAttribute("disabled")).toBe(true);
  });

  it("should treat whitespace as no URL at all", () => {
    renderDialog();

    fireEvent.change(urlBox(), { target: { value: "   " } });

    expect(embedButton().hasAttribute("disabled")).toBe(true);
  });

  it("should embed the video and close", () => {
    const { setYoutubeVideo, onOpenChange } = renderDialog();

    fireEvent.change(urlBox(), { target: { value: "https://youtu.be/abc123" } });
    fireEvent.click(embedButton());

    expect(setYoutubeVideo).toHaveBeenCalledWith({ src: "https://youtu.be/abc123" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should trim the pasted URL", () => {
    // Copying a link out of the browser bar often brings whitespace with it.
    const { setYoutubeVideo } = renderDialog();

    fireEvent.change(urlBox(), { target: { value: "  https://youtu.be/abc123  " } });
    fireEvent.click(embedButton());

    expect(setYoutubeVideo).toHaveBeenCalledWith({ src: "https://youtu.be/abc123" });
  });

  it("should embed on Enter without reaching for the button", () => {
    const { setYoutubeVideo, onOpenChange } = renderDialog();

    fireEvent.change(urlBox(), { target: { value: "https://youtu.be/abc123" } });
    fireEvent.keyDown(urlBox(), { key: "Enter" });

    expect(setYoutubeVideo).toHaveBeenCalledWith({ src: "https://youtu.be/abc123" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should ignore Enter on an empty box", () => {
    const { setYoutubeVideo, onOpenChange } = renderDialog();

    fireEvent.keyDown(urlBox(), { key: "Enter" });

    expect(setYoutubeVideo).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("should close without embedding when cancelled", () => {
    const { setYoutubeVideo, onOpenChange } = renderDialog();
    fireEvent.change(urlBox(), { target: { value: "https://youtu.be/abc123" } });

    fireEvent.click(screen.getByRole("button", { name: "postForm.cancel" }));

    expect(setYoutubeVideo).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
