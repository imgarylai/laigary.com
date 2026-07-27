// @vitest-environment jsdom
//
// Pasting or dropping an image into the editor (#176). The interesting part is
// not the upload — that is lib/upload-client, already covered — but that the
// in-flight placeholder is a decoration rather than a node, so it never reaches
// the markdown the form saves, and that a non-image paste is left completely
// alone.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Editor } from "@tiptap/react";
import { createExtensions } from "@/components/admin/editor/extensions";
import { imageFilesFrom, pendingUploadCount } from "@/components/admin/editor/image-upload";

const { uploadFile, compressImage, toast } = vi.hoisted(() => ({
  uploadFile: vi.fn(),
  compressImage: vi.fn(),
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock("@/lib/upload-client", () => ({
  uploadFile,
  compressImage,
  getCroppedBlob: vi.fn(),
}));
vi.mock("sonner", () => ({ toast }));

const png = (name = "shot.png") => new File(["bytes"], name, { type: "image/png" });

function makeEditor(content = "hello") {
  return new Editor({
    extensions: createExtensions({
      placeholder: "",
      uploadMessages: {
        uploading: "Uploading...",
        failed: "Upload failed",
        timedOut: "Upload timed out",
      },
    }),
    content,
    contentType: "markdown",
  });
}

/**
 * Fire the plugin's paste handler the way ProseMirror would. When ours declines,
 * someProp carries on to the markdown paste handler, which reads getData/types
 * off the clipboard — so the stand-in has to carry them too.
 */
function paste(editor: Editor, clipboardData: unknown): boolean {
  const data = clipboardData
    ? { getData: () => "", types: [] as string[], ...(clipboardData as object) }
    : clipboardData;
  const event = { clipboardData: data, preventDefault: vi.fn() };
  return (
    editor.view.someProp("handlePaste", (fn) =>
      fn(editor.view, event as unknown as ClipboardEvent, undefined as never),
    ) ?? false
  );
}

/** Fire the plugin's drop handler. `moved` marks an in-editor node drag. */
function drop(editor: Editor, dataTransfer: unknown, moved = false): boolean {
  const event = { dataTransfer, clientX: 10, clientY: 10, preventDefault: vi.fn() };
  return (
    editor.view.someProp("handleDrop", (fn) =>
      fn(editor.view, event as unknown as DragEvent, undefined as never, moved),
    ) ?? false
  );
}

/** Let the upload promise chain settle. */
const settle = () => new Promise((r) => setTimeout(r, 0));

let editor: Editor;
beforeEach(() => {
  vi.clearAllMocks();
  // posAtCoords walks the DOM from elementFromPoint, which jsdom does not
  // implement at all; without this the drop handler throws instead of falling
  // back to the caret.
  document.elementFromPoint = () => null;
  compressImage.mockImplementation(async (f: File) => f);
  editor = makeEditor();
});
afterEach(() => editor.destroy());

describe("imageFilesFrom", () => {
  it("should pick out the image files", () => {
    const data = { files: [png(), new File(["x"], "notes.txt", { type: "text/plain" })] };

    expect(imageFilesFrom(data as unknown as DataTransfer).map((f) => f.name)).toEqual([
      "shot.png",
    ]);
  });

  it("should find nothing in a text-only transfer", () => {
    expect(imageFilesFrom({ files: [] } as unknown as DataTransfer)).toEqual([]);
  });

  it("should tolerate a transfer with no files at all", () => {
    expect(imageFilesFrom(null)).toEqual([]);
    expect(imageFilesFrom({} as DataTransfer)).toEqual([]);
  });
});

describe("pasting an image", () => {
  it("should upload it and insert the returned URL", async () => {
    uploadFile.mockResolvedValue("/uploads/shot.png");

    expect(paste(editor, { files: [png()] })).toBe(true);
    await settle();

    expect(editor.getHTML()).toContain('src="/uploads/shot.png"');
    expect(compressImage).toHaveBeenCalled();
  });

  it("should show a placeholder while the bytes are in flight, and clear it after", async () => {
    let release!: (url: string) => void;
    uploadFile.mockReturnValue(new Promise<string>((r) => (release = r)));

    paste(editor, { files: [png()] });
    await settle();
    expect(pendingUploadCount(editor.state)).toBe(1);

    release("/uploads/shot.png");
    await settle();

    expect(pendingUploadCount(editor.state)).toBe(0);
  });

  it("should keep the placeholder out of the saved markdown", async () => {
    // The whole reason it is a decoration: a node would serialize, and ⌘S
    // mid-upload would persist something meaningless.
    uploadFile.mockReturnValue(new Promise<string>(() => {}));

    paste(editor, { files: [png()] });
    await settle();

    expect(pendingUploadCount(editor.state)).toBe(1);
    expect(editor.getMarkdown()).toBe("hello");
  });

  it("should leave nothing behind and report why when the upload fails", async () => {
    uploadFile.mockRejectedValue(new Error("R2 said no"));

    paste(editor, { files: [png()] });
    await settle();

    expect(pendingUploadCount(editor.state)).toBe(0);
    expect(editor.getHTML()).not.toContain("<img");
    expect(toast.error).toHaveBeenCalledWith("R2 said no");
  });

  it("should fall back to a generic message when the failure carries none", async () => {
    uploadFile.mockRejectedValue("nope");

    paste(editor, { files: [png()] });
    await settle();

    expect(toast.error).toHaveBeenCalledWith("Upload failed");
  });

  it("should drop the image where the placeholder ended up, not where it started", async () => {
    // Typing while an image uploads is normal. The decoration maps through those
    // transactions, so the image must land after the newly typed text.
    let release!: (url: string) => void;
    uploadFile.mockReturnValue(new Promise<string>((r) => (release = r)));
    editor.commands.setTextSelection(1);

    paste(editor, { files: [png()] });
    await settle();
    editor.commands.insertContentAt(1, "XY");
    release("/uploads/shot.png");
    await settle();

    // The image is a block node, so it splits the paragraph: the assertion that
    // matters is that it landed *after* the typed text. Had the decoration not
    // mapped, it would sit at the original offset, ahead of "XY".
    const html = editor.getHTML();
    expect(html.indexOf("XY")).toBeLessThan(html.indexOf('src="/uploads/shot.png"'));
    expect(html.indexOf('src="/uploads/shot.png"')).toBeLessThan(html.indexOf("hello"));
  });

  it("should insert nothing if the placeholder was deleted mid-upload", async () => {
    // Selecting everything and typing over it takes the placeholder with it;
    // the image would otherwise reappear somewhere the writer is not looking.
    let release!: (url: string) => void;
    uploadFile.mockReturnValue(new Promise<string>((r) => (release = r)));

    paste(editor, { files: [png()] });
    await settle();
    editor.commands.setContent("", { contentType: "markdown" });
    release("/uploads/shot.png");
    await settle();

    expect(editor.getHTML()).not.toContain("<img");
  });

  it("should give up on an upload that never settles", async () => {
    // Not hypothetical: `fetch` has no default timeout, so a stalled PUT to
    // storage never settles. Without a deadline the badge sits in the document
    // forever, clearable only by reloading.
    vi.useFakeTimers();
    uploadFile.mockReturnValue(new Promise<string>(() => {}));

    paste(editor, { files: [png()] });
    await vi.advanceTimersByTimeAsync(1);
    expect(pendingUploadCount(editor.state)).toBe(1);

    await vi.advanceTimersByTimeAsync(60_000);

    expect(pendingUploadCount(editor.state)).toBe(0);
    expect(toast.error).toHaveBeenCalledWith("Upload timed out");
    vi.useRealTimers();
  });

  it("should not give up on an upload that is merely slow", async () => {
    vi.useFakeTimers();
    let release!: (url: string) => void;
    uploadFile.mockReturnValue(new Promise<string>((r) => (release = r)));

    paste(editor, { files: [png()] });
    await vi.advanceTimersByTimeAsync(30_000);
    release("/uploads/slow.png");
    await vi.advanceTimersByTimeAsync(1);

    expect(editor.getHTML()).toContain('src="/uploads/slow.png"');
    expect(toast.error).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("should upload every image in a multi-file paste", async () => {
    uploadFile.mockResolvedValueOnce("/uploads/a.png").mockResolvedValueOnce("/uploads/b.png");

    paste(editor, { files: [png("a.png"), png("b.png")] });
    await settle();

    expect(editor.getHTML()).toContain('src="/uploads/a.png"');
    expect(editor.getHTML()).toContain('src="/uploads/b.png"');
  });
});

describe("pasting anything else", () => {
  it("should not handle a text-only paste", async () => {
    // Returning true here would break every ordinary paste in the editor.
    expect(paste(editor, { files: [] })).toBe(false);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("should not handle a paste carrying only a non-image file", () => {
    const data = { files: [new File(["x"], "notes.txt", { type: "text/plain" })] };

    expect(paste(editor, data)).toBe(false);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("should not handle a paste with no clipboard data", () => {
    expect(paste(editor, null)).toBe(false);
  });
});

describe("dropping an image", () => {
  it("should upload it and insert the returned URL", async () => {
    uploadFile.mockResolvedValue("/uploads/dropped.png");

    expect(drop(editor, { files: [png()] })).toBe(true);
    await settle();

    expect(editor.getHTML()).toContain('src="/uploads/dropped.png"');
  });

  it("should leave an in-editor node drag to ProseMirror", () => {
    // `moved` means the user is dragging something that is already in the
    // document; hijacking it would upload nothing and break the move.
    expect(drop(editor, { files: [png()] }, true)).toBe(false);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("should not handle a drop with no image in it", () => {
    expect(drop(editor, { files: [] })).toBe(false);
    expect(drop(editor, null)).toBe(false);
    expect(uploadFile).not.toHaveBeenCalled();
  });
});
