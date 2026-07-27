// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import type { NodeViewProps } from "@tiptap/react";
import { CodeBlockCard } from "@/components/admin/editor/CodeBlockCard";

// NodeViewWrapper/NodeViewContent read Tiptap's node-view context, which only
// exists inside a mounted editor. The card's own logic — which label to show,
// which attribute to write — is what matters here, so the primitives are
// reduced to plain elements and the card is rendered directly.
vi.mock("@tiptap/react", () => ({
  NodeViewWrapper: ({ children, ...props }: { children?: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  NodeViewContent: ({ as: Tag = "div", ...props }: { as?: React.ElementType }) => (
    <Tag {...props} />
  ),
}));

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

// cmdk observes its list element for size changes; jsdom has no ResizeObserver,
// and without it the popup never renders.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

const writeText = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal("navigator", { clipboard: { writeText } });

/** The picker's trigger — a button, not a native select. */
function trigger(): HTMLElement {
  return screen.getByRole("button", { name: "editor.codeLanguage" });
}

// The picker renders its list in a portal only once opened. Open it, then click
// the option with the given label — scoped to the popup, since the trigger
// carries the current language's label too.
function selectOption(optionText: string) {
  fireEvent.click(trigger());
  fireEvent.click(within(screen.getByRole("dialog")).getByText(optionText));
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

function renderCard(language: string | null, textContent = "def fib(n):\n    return n") {
  const updateAttributes = vi.fn();
  const focus = vi.fn();
  const props = {
    node: { attrs: { language }, textContent },
    updateAttributes,
    editor: { commands: { focus } },
  } as unknown as NodeViewProps;

  render(<CodeBlockCard {...props} />);
  return { updateAttributes, focus };
}

/** The label the trigger currently shows. */
function triggerLabel(): string {
  return trigger().textContent?.trim() ?? "";
}

describe("CodeBlockCard", () => {
  it("should show the language name when the fence names a known language", () => {
    renderCard("python");

    expect(triggerLabel()).toContain("Python");
  });

  it("should show the auto-detect label when the fence carries no language", () => {
    // A bare fence is auto-detected by both the editor and the renderer, which
    // is a different outcome from ```text — the picker names both.
    renderCard(null);

    expect(triggerLabel()).toContain("editor.codeLanguageAuto");
  });

  it("should show the plain-text label when the fence opts out of highlighting", () => {
    renderCard("text");

    expect(triggerLabel()).toContain("editor.codeLanguagePlain");
  });

  it("should show an unrecognised language as-is rather than silently rewriting it", () => {
    // Content predating the shared list, or a hand-typed fence, can name
    // something the picker doesn't offer.
    renderCard("rust");

    expect(triggerLabel()).toContain("rust");
  });

  it("should write the chosen language to the node when a language is picked", async () => {
    // The whole point of the card: a mistagged fence is fixable in place.
    const { updateAttributes, focus } = renderCard(null);

    selectOption("SQL");

    await waitFor(() => expect(updateAttributes).toHaveBeenCalledWith({ language: "sql" }));
    // Focus goes back to the code so typing continues where the author was.
    expect(focus).toHaveBeenCalled();
  });

  it("should clear the language to null when auto-detect is picked", async () => {
    // null is what serializes back to a bare ``` fence.
    const { updateAttributes } = renderCard("python");

    selectOption("editor.codeLanguageAuto");

    await waitFor(() => expect(updateAttributes).toHaveBeenCalledWith({ language: null }));
  });

  it("should copy the block's code when the copy button is used", async () => {
    renderCard("python", "print('hi')");

    fireEvent.click(screen.getByRole("button", { name: "editor.codeCopy" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("print('hi')"));
    // The button flips to a confirmation once the copy resolves.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "editor.codeCopied" })).toBeTruthy(),
    );
  });
});
