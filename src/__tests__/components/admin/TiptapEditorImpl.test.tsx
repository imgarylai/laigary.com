// @vitest-environment jsdom
//
// The editor shell itself: what it hands back to the form, what it accepts from
// the form, and when it is allowed to rebuild the document. Every branch here
// is load-bearing for CJK input or for typing latency (#175), and none of it
// was covered — PostForm and friends mock the whole editor away.

import { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Editor } from "@tiptap/react";
import TiptapEditorImpl from "@/components/admin/TiptapEditorImpl";

const { renderMarkdown } = vi.hoisted(() => ({
  renderMarkdown: vi.fn(async (md: string) => `<p data-rendered>${md}</p>`),
}));
vi.mock("@/lib/markdown", () => ({ renderMarkdown }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

// Grab the real editor instance on its way past, so a test can drive
// ProseMirror directly instead of guessing at DOM events jsdom cannot produce.
let editor: Editor | null = null;
vi.mock("@tiptap/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tiptap/react")>();
  return {
    ...actual,
    useEditor: ((options: Parameters<typeof actual.useEditor>[0], deps?: unknown[]) => {
      const instance = actual.useEditor(options, deps as never);
      editor = instance;
      return instance;
    }) as typeof actual.useEditor,
  };
});

/** Simulate real typing through ProseMirror's input pipeline. */
function type(e: Editor, text: string): void {
  for (const char of text) {
    const view = e.view;
    const { from, to } = view.state.selection;
    const handled = view.someProp("handleTextInput", (f) =>
      f(view, from, to, char, () => view.state.tr.insertText(char, from, to)),
    );
    if (!handled) view.dispatch(view.state.tr.insertText(char, from, to));
  }
}

/** Stands in for react-hook-form: whatever the editor emits comes back down. */
let setExternal!: (value: string) => void;

function Controlled({
  initial = "",
  showPreview = false,
  onEmit,
}: {
  initial?: string;
  showPreview?: boolean;
  onEmit?: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  setExternal = setValue;
  return (
    <TiptapEditorImpl
      value={value}
      showPreview={showPreview}
      onChange={(v) => {
        onEmit?.(v);
        setValue(v);
      }}
    />
  );
}

async function mount(props: Parameters<typeof Controlled>[0] = {}) {
  const onEmit = vi.fn();
  render(<Controlled {...props} onEmit={onEmit} />);
  await waitFor(() => expect(editor).toBeTruthy());
  await screen.findByRole("button", { name: "editor.bold" });
  return { onEmit, editor: editor! };
}

beforeEach(() => {
  editor = null;
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const surface = () => document.querySelector(".ProseMirror")!;
/** The rendered preview, as distinct from the writing surface. */
const previewBody = () => document.querySelector("[data-rendered]");

/** `composing` is a getter on EditorView, so it is redefined rather than set. */
function setComposing(e: Editor, value: boolean) {
  Object.defineProperty(e.view, "composing", { configurable: true, get: () => value });
}

describe("TiptapEditorImpl", () => {
  it("should mount the toolbar, the writing surface and the counters", async () => {
    await mount();

    expect(screen.getByRole("button", { name: "editor.bold" })).toBeTruthy();
    expect(surface()).toBeTruthy();
    expect(screen.getByText(/editor.characters/)).toBeTruthy();
  });

  it("should hand the document back to the form as markdown", async () => {
    const { onEmit, editor: e } = await mount();

    act(() => type(e, "hello"));

    expect(onEmit).toHaveBeenCalled();
    expect(onEmit.mock.lastCall?.[0]).toContain("hello");
  });

  it("should keep the caret where it was when the form echoes our own value back", async () => {
    // The echo is the common case — every keystroke round-trips through the
    // form. Rebuilding the document on it would fling the caret to the top.
    const { editor: e } = await mount();
    act(() => type(e, "hello"));
    const caretBefore = e.state.selection.from;
    const paragraph = surface().firstElementChild;

    act(() => setExternal(e.getMarkdown()));

    expect(e.state.selection.from).toBe(caretBefore);
    // Same node object: a re-parse would have replaced it.
    expect(surface().firstElementChild).toBe(paragraph);
  });

  it("should adopt a genuine external change, such as a form reset", async () => {
    const { editor: e } = await mount({ initial: "first" });

    act(() => setExternal("# Reset heading"));

    await waitFor(() => expect(surface().querySelector("h1")?.textContent).toBe("Reset heading"));
    expect(e.getText()).not.toContain("first");
  });

  it("should not emit a fresh change back to the form when adopting one", async () => {
    // emitUpdate: false — otherwise a reset would bounce straight back and mark
    // the form dirty the moment it was cleaned.
    const { onEmit } = await mount({ initial: "first" });
    onEmit.mockClear();

    act(() => setExternal("# Reset heading"));

    await waitFor(() => expect(surface().querySelector("h1")).toBeTruthy());
    expect(onEmit).not.toHaveBeenCalled();
  });

  it("should refuse to rebuild the document mid-IME-composition", async () => {
    // setContent tears down and re-parses the document, which aborts a 注音 or
    // 拼音 composition in progress — the "cursor jumps / character typed twice"
    // bug. The guard is the only thing standing between CJK input and that.
    const { editor: e } = await mount({ initial: "keep me" });
    setComposing(e, true);

    act(() => setExternal("# Replaced"));

    expect(surface().querySelector("h1")).toBeNull();
    expect(e.getText()).toContain("keep me");
  });

  it("should adopt the change once the composition finishes", async () => {
    // Nothing is dropped by the guard: the effect runs again on the next value.
    const { editor: e } = await mount({ initial: "keep me" });
    setComposing(e, true);
    act(() => setExternal("# Replaced"));

    setComposing(e, false);
    act(() => setExternal("# Replaced later"));

    await waitFor(() => expect(surface().querySelector("h1")?.textContent).toBe("Replaced later"));
  });

  it("should open the link dialog on Cmd/Ctrl+K", async () => {
    await mount();

    fireEvent.keyDown(surface(), { key: "k", metaKey: true });

    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("should keep Cmd/Ctrl+B inside the editor", async () => {
    // The admin sidebar binds Cmd/Ctrl+B on `window` to toggle itself, which
    // would both bold the text and slide the sidebar out. Bold is handled on the
    // editable element first, so stopping the event on the way out is what keeps
    // the two apart — while leaving the shortcut working everywhere else.
    const sidebarToggle = vi.fn();
    window.addEventListener("keydown", sidebarToggle);
    await mount();

    fireEvent.keyDown(surface(), { key: "b", metaKey: true, bubbles: true });

    expect(sidebarToggle).not.toHaveBeenCalled();
    window.removeEventListener("keydown", sidebarToggle);
  });

  it("should let other shortcuts through to the window", async () => {
    const other = vi.fn();
    window.addEventListener("keydown", other);
    await mount();

    fireEvent.keyDown(surface(), { key: "j", metaKey: true, bubbles: true });

    expect(other).toHaveBeenCalled();
    window.removeEventListener("keydown", other);
  });

  it("should count the characters as the document grows", async () => {
    // CharacterCount subscribes to the editor rather than reading storage during
    // render, so it has to keep up without the parent doing anything for it.
    const { editor: e } = await mount();

    act(() => type(e, "hello"));

    await waitFor(() => expect(screen.getByText(/^5 /)).toBeTruthy());
    expect(screen.getByText(/^1 /)).toBeTruthy();
  });
});

describe("TiptapEditorImpl preview", () => {
  it("should not run the markdown pipeline at all while the preview is hidden", async () => {
    // Fake timers rather than a real sleep. The debounce this guards is 300ms,
    // so the 50ms wait this replaces could not have caught a pipeline run even
    // with the `showPreview` gate deleted — the assertion was unfailable.
    // `mount()` is unusable here: its findBy/waitFor would deadlock against the
    // fake clock. Advance well past the debounce, then assert synchronously.
    vi.useFakeTimers();
    render(<Controlled showPreview={false} />);
    await vi.waitFor(() => expect(editor).toBeTruthy());
    const e = editor!;

    act(() => type(e, "hello"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(renderMarkdown).not.toHaveBeenCalled();
    expect(screen.queryByText("postForm.previewPlaceholder")).toBeNull();
  });

  it("should survive a scroll with no layout to measure", async () => {
    // The preview trails the editor proportionally, which means reading
    // geometry on scroll. jsdom reports zero-sized boxes, so this pins the
    // degenerate case: nothing to travel, nothing to do, no throw.
    await mount({ initial: "hello", showPreview: true });

    expect(() => fireEvent.scroll(window)).not.toThrow();
  });

  it("should render the preview once the document settles", async () => {
    await mount({ initial: "hello", showPreview: true });

    await waitFor(() => expect(renderMarkdown).toHaveBeenCalledWith("hello"));
    // Scoped to the preview: "hello" is also in the writing surface.
    await waitFor(() => expect(previewBody()?.textContent).toBe("hello"));
  });

  it("should not run the pipeline for keystrokes that are still coming", async () => {
    // The whole unified pipeline — remark, temml, rehype-highlight — must never
    // compete with a keystroke, so it is debounced and then deferred to idle.
    vi.useFakeTimers();
    render(<Controlled showPreview />);
    await vi.waitFor(() => expect(editor).toBeTruthy());
    const e = editor!;
    renderMarkdown.mockClear();

    for (const char of "abcdef") {
      act(() => type(e, char));
      act(() => void vi.advanceTimersByTime(100));
    }

    // 600ms of typing, all of it inside a resetting 300ms window.
    expect(renderMarkdown).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(renderMarkdown).toHaveBeenCalledTimes(1);
    expect(renderMarkdown.mock.lastCall?.[0]).toContain("abcdef");
  });
});

// The three dialogs the editor owns. Each is opened by a closure this component
// passes down — `dialogs.openImage` / `openYouTube` into the `/` menu's
// extensions, and `openLink` into the memoised toolbar — and a closure wired to
// the wrong `setState` opens the wrong dialog with no other symptom.
describe("TiptapEditorImpl dialogs", () => {
  /** Run the `/` menu the way a user does: type the query, then Enter. */
  async function pickSlashItem(e: Editor, query: string, label: string) {
    act(() => type(e, query));
    await screen.findByText(label);
    act(() => {
      e.view.someProp("handleKeyDown", (handler) =>
        handler(e.view, new KeyboardEvent("keydown", { key: "Enter" })),
      );
    });
  }

  it("opens the image dialog from the / menu", async () => {
    const { editor: e } = await mount();

    await pickSlashItem(e, "/image", "editor.slash.image");

    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("editor.uploadImage");
  });

  it("opens the YouTube dialog from the / menu", async () => {
    const { editor: e } = await mount();

    await pickSlashItem(e, "/youtube", "editor.slash.youtube");

    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("editor.embedYouTube");
  });

  it("opens the link dialog from the toolbar button", async () => {
    // ⌘K is covered above; this is the same dialog through the other door, and
    // the door that goes through a `useCallback` the toolbar memo depends on.
    await mount();

    fireEvent.click(screen.getByRole("button", { name: /editor.link/ }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
  });
});
