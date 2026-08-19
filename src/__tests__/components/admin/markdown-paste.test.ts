// @vitest-environment happy-dom
//
// Pasting markdown source into the editor used to land as literal text — a
// table stayed a row of pipes. The detection half is deliberately conservative:
// text that is not markdown has to paste exactly as it did before, because
// parsing it collapses single newlines and turns stray `*` into emphasis.

import { describe, it, expect, vi, afterEach } from "vitest";
import { Editor } from "@tiptap/react";
import {
  looksLikeMarkdown,
  isVerbatimContext,
  plainTextContent,
  resetPlainPasteRequest,
  PLAIN_PASTE_WINDOW_MS,
} from "@/components/admin/editor/markdown-paste";
import { createExtensions } from "@/components/admin/editor/extensions";

// The image-paste case below hands a real File to the upload plugin, and
// compressImage would drag browser-image-compression into jsdom, where it
// throws "Expected an Uint8Array" from inside its worker — outside uploadAt's
// try/catch, so it surfaced as an unhandled error rather than a failed test.
// Same stubs editor-image-upload.test.ts uses.
const { uploadFile, compressImage, toast } = vi.hoisted(() => ({
  uploadFile: vi.fn(async () => "https://cdn.example.com/shot.png"),
  compressImage: vi.fn(async (file: File) => file),
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock("@/lib/upload-client", () => ({ uploadFile, compressImage, getCroppedBlob: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

describe("looksLikeMarkdown", () => {
  it.each([
    ["an ATX heading", "# Title"],
    ["a deeper heading", "### Section"],
    ["a fenced code block", "```python\nprint(1)\n```"],
    ["a blockquote", "> quoted"],
    ["a bullet list", "- one\n- two"],
    ["a task list", "- [ ] todo"],
    ["an ordered list", "1. first\n2. second"],
    ["a thematic break", "before\n\n---\n\nafter"],
    ["a link", "see [docs](https://example.com) for more"],
    ["an image", "![alt](https://example.com/a.png)"],
    ["bold text", "this is **important** here"],
    ["italic text", "this is *subtle* here"],
    ["underscore italic", "this is _subtle_ here"],
    ["strikethrough", "this is ~~gone~~ now"],
    ["inline code", "run `pnpm test` first"],
    ["a table", "| Lang | Year |\n| --- | --- |\n| Go | 2009 |"],
  ])("should detect %s", (_name, text) => {
    expect(looksLikeMarkdown(text)).toBe(true);
  });

  it.each([
    ["a plain sentence", "Just some ordinary text."],
    ["multi-line plain text", "台北市信義區\n松高路 11 號\n02-1234-5678"],
    ["a bare url", "https://example.com/a/b?c=d"],
    ["arithmetic with asterisks", "the area is a * b * c"],
    ["snake_case identifiers", "call user_name_field then user_id_field"],
    ["console output with a pipe", "cat file | grep foo"],
    ["a single pipe row without a delimiter", "| not | really | a table |"],
    ["an empty string", ""],
  ])("should leave %s alone", (_name, text) => {
    expect(looksLikeMarkdown(text)).toBe(false);
  });

  it("should require both halves of a table before claiming one", () => {
    // The delimiter row is what separates a real table from piped output.
    expect(looksLikeMarkdown("| a | b |\n| c | d |")).toBe(false);
    expect(looksLikeMarkdown("| a | b |\n| --- | --- |\n| c | d |")).toBe(true);
  });
});

afterEach(() => {
  resetPlainPasteRequest();
  vi.useRealTimers();
});

function editorWith(content = "") {
  return new Editor({ extensions: createExtensions({ placeholder: "" }), content });
}

describe("isVerbatimContext", () => {
  it("should report a caret in ordinary text as parseable", () => {
    const editor = editorWith("<p>hello</p>");
    editor.commands.setTextSelection(2);
    expect(isVerbatimContext(editor.state)).toBe(false);
    editor.destroy();
  });

  it("should protect the inside of a code block", () => {
    // Pasting into a code block is how code gets quoted; rewriting it there
    // would destroy the very thing being pasted.
    const editor = editorWith("<pre><code>print(1)</code></pre>");
    editor.commands.setTextSelection(3);
    expect(isVerbatimContext(editor.state)).toBe(true);
    editor.destroy();
  });

  it("should protect an inline code span", () => {
    const editor = editorWith("<p><code>npm i</code></p>");
    editor.commands.setTextSelection(3);
    expect(isVerbatimContext(editor.state)).toBe(true);
    editor.destroy();
  });
});

// The whole point: markdown handed to insertContent has to come back as real
// nodes, and survive the round-trip to the markdown the form stores.
describe("markdown insertion", () => {
  it("should turn pasted markdown into real nodes", () => {
    const editor = editorWith();
    editor.commands.insertContent(
      "| Lang | Year |\n| --- | --- |\n| Go | 2009 |\n\nA [link](https://example.com) and **bold**.\n\n- one\n- two",
      { contentType: "markdown" },
    );

    const html = editor.getHTML();
    expect(html).toContain("<table");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("<strong");
    expect(html).toContain("<ul");
    editor.destroy();
  });

  it("should round-trip back to equivalent markdown", () => {
    // The form stores markdown, so a paste that renders correctly but
    // serialises to something else would corrupt the note on save.
    const editor = editorWith();
    editor.commands.insertContent("## Title\n\n- one\n- two\n\n`code` and **bold**", {
      contentType: "markdown",
    });

    const md = editor.getMarkdown();
    expect(md).toContain("## Title");
    expect(md).toContain("- one");
    expect(md).toContain("`code`");
    expect(md).toContain("**bold**");
    editor.destroy();
  });
});

/**
 * A paste event shaped like the real one. `types` matters: a copy from a web
 * page carries text/html alongside the plain text, and that is the case the
 * handler has to decline.
 */
function pasteEvent(data: { text?: string; html?: string; files?: readonly File[] }) {
  const types: string[] = [];
  if (data.text !== undefined) types.push("text/plain");
  if (data.html !== undefined) types.push("text/html");
  // Answering only for the types actually on the clipboard matters: the code
  // block extension asks for `vscode-editor-data` and JSON.parses whatever
  // comes back, so a catch-all stub throws before this handler is reached.
  const values: Record<string, string | undefined> = {
    "text/plain": data.text,
    "text/html": data.html,
  };
  return {
    clipboardData: {
      types,
      files: data.files ?? [],
      getData: (type: string) => values[type] ?? "",
    },
    preventDefault: vi.fn(),
  } as unknown as ClipboardEvent;
}

/** Dispatch through ProseMirror itself, so plugin ordering is under test too. */
function paste(editor: Editor, event: ClipboardEvent): boolean {
  return (
    editor.view.someProp("handlePaste", (fn) =>
      fn(editor.view, event, editor.state.selection.content()),
    ) ?? false
  );
}

describe("handlePaste", () => {
  it("should convert pasted markdown into nodes", () => {
    const editor = editorWith();

    expect(paste(editor, pasteEvent({ text: "| a | b |\n| --- | --- |\n| 1 | 2 |" }))).toBe(true);
    expect(editor.getHTML()).toContain("<table");
    editor.destroy();
  });

  it("should decline plain text so it pastes the way it always did", () => {
    const editor = editorWith();

    expect(paste(editor, pasteEvent({ text: "line one\nline two" }))).toBe(false);
    editor.destroy();
  });

  it("should decline when the clipboard also carries html", () => {
    // A copy from a web page: ProseMirror's own parsing knows the source
    // structure and beats re-deriving it from the plain-text fallback.
    const editor = editorWith();

    const handled = paste(editor, pasteEvent({ text: "# Title", html: "<h1>Title</h1>" }));

    expect(handled).toBe(false);
    editor.destroy();
  });

  it("should decline inside a code block even when the text is markdown", () => {
    const editor = editorWith("<pre><code>x</code></pre>");
    editor.commands.setTextSelection(2);

    expect(paste(editor, pasteEvent({ text: "# Title" }))).toBe(false);
    editor.destroy();
  });

  it("should leave a clipboard image to the upload plugin", async () => {
    const editor = editorWith();
    const file = new File(["x"], "shot.png", { type: "image/png" });

    paste(editor, pasteEvent({ text: "# Title", files: [file] }));

    // Waiting for the image to land proves the upload plugin claimed the paste,
    // and keeps the editor alive until its async work is done — destroying it
    // mid-flight would dispatch onto a torn-down view.
    await vi.waitFor(() => expect(editor.getHTML()).toContain("<img"));
    expect(editor.getHTML()).not.toContain("<h1");
    editor.destroy();
  });
});

describe("plainTextContent", () => {
  it("should split blank-line-separated blocks into paragraphs", () => {
    expect(plainTextContent("one\n\ntwo")).toEqual([
      { type: "paragraph", content: [{ type: "text", text: "one" }] },
      { type: "paragraph", content: [{ type: "text", text: "two" }] },
    ]);
  });

  it("should keep single newlines as hard breaks inside one paragraph", () => {
    // Plain text pasted from a terminal or an address block is laid out by its
    // line breaks; collapsing them would lose the only structure it has.
    expect(plainTextContent("one\ntwo")).toEqual([
      {
        type: "paragraph",
        content: [
          { type: "text", text: "one" },
          { type: "hardBreak" },
          { type: "text", text: "two" },
        ],
      },
    ]);
  });

  it("should emit no empty text node for a blank line", () => {
    // An empty text node is not a valid ProseMirror node.
    const [paragraph] = plainTextContent("one\n\ntwo");
    expect(paragraph.content?.every((node) => node.type !== "text" || node.text)).toBe(true);
  });

  it("should carry markdown through untouched", () => {
    const [paragraph] = plainTextContent("# Title");
    expect(paragraph).toEqual({
      type: "paragraph",
      content: [{ type: "text", text: "# Title" }],
    });
  });
});

// ⌘⇧V is the one escape hatch from everything else this file does: it has to
// beat the markdown conversion AND ProseMirror's html parsing.
describe("plain paste", () => {
  /**
   * Press the shortcut the way ProseMirror delivers it.
   *
   * ctrlKey, not metaKey: prosemirror-keymap resolves `Mod-` against
   * `navigator.platform`, which jsdom reports as an empty string, so the
   * binding normalises to Ctrl- here and to Meta- on a real Mac.
   */
  function pressPlainPaste(editor: Editor) {
    const handled = editor.view.someProp("handleKeyDown", (fn) =>
      fn(editor.view, new KeyboardEvent("keydown", { key: "v", ctrlKey: true, shiftKey: true })),
    );
    // The shortcut must NOT claim the event — the browser still has to run its
    // own paste for a clipboard event to arrive at all.
    expect(handled ?? false).toBe(false);
  }

  it("should paste markdown as literal text instead of converting it", () => {
    const editor = editorWith();
    pressPlainPaste(editor);

    expect(paste(editor, pasteEvent({ text: "# Title" }))).toBe(true);

    const html = editor.getHTML();
    expect(html).not.toContain("<h1");
    expect(html).toContain("# Title");
    editor.destroy();
  });

  it("should drop formatting when the clipboard carries html", () => {
    // The case the issue was originally about: pasting from a browser drags
    // marks in every time.
    const editor = editorWith();
    pressPlainPaste(editor);

    expect(
      paste(editor, pasteEvent({ text: "bold text", html: "<p><strong>bold text</strong></p>" })),
    ).toBe(true);

    const html = editor.getHTML();
    expect(html).not.toContain("<strong");
    expect(html).toContain("bold text");
    editor.destroy();
  });

  it("should apply to one paste only", () => {
    const editor = editorWith();
    pressPlainPaste(editor);
    paste(editor, pasteEvent({ text: "# One" }));

    // Second paste, no second keystroke: markdown converts again.
    paste(editor, pasteEvent({ text: "# Two" }));

    const html = editor.getHTML();
    expect(html).toContain("# One");
    expect(html).toContain("<h1");
    editor.destroy();
  });

  it("should lapse when no paste follows the keystroke", () => {
    // A ⌘⇧V that the platform never turns into a paste must not silently
    // change whatever gets pasted minutes later.
    vi.useFakeTimers();
    const editor = editorWith();
    pressPlainPaste(editor);
    vi.advanceTimersByTime(PLAIN_PASTE_WINDOW_MS + 1);

    paste(editor, pasteEvent({ text: "# Title" }));

    expect(editor.getHTML()).toContain("<h1");
    editor.destroy();
  });

  it("should leave a code block to ProseMirror's verbatim insert", () => {
    const editor = editorWith("<pre><code>x</code></pre>");
    editor.commands.setTextSelection(2);
    pressPlainPaste(editor);

    expect(paste(editor, pasteEvent({ text: "# Title" }))).toBe(false);
    editor.destroy();
  });

  it("should still leave a clipboard image to the upload plugin", async () => {
    const editor = editorWith();
    const file = new File(["x"], "shot.png", { type: "image/png" });
    pressPlainPaste(editor);

    paste(editor, pasteEvent({ text: "# Title", files: [file] }));

    // Same wait as the markdown-paste case: the upload is async, and tearing
    // the editor down mid-flight dispatches onto a destroyed view.
    await vi.waitFor(() => expect(editor.getHTML()).toContain("<img"));
    expect(editor.getHTML()).not.toContain("# Title");
    editor.destroy();
  });
});
