// @vitest-environment jsdom
//
// `@` article mention: picking a result must replace the typed `@query` with a
// plain markdown link (title as text) plus an unlinked trailing space — no
// custom node types in the stored content.
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, fireEvent } from "@testing-library/react";
import { Editor } from "@tiptap/react";
import { createExtensions } from "@/components/admin/editor/extensions";
import {
  insertArticleLink,
  LinkSuggestionList,
  type LinkSuggestionListHandle,
} from "@/components/admin/editor/link-suggestion";
import type { LinkTarget } from "@/server/admin/reads";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "en" }),
}));

vi.mock("@/server/admin/reads", () => ({
  searchLinkTargetsFn: vi.fn(),
}));

afterEach(cleanup);

const gasStation: LinkTarget = {
  type: "note",
  title: "134. Gas Station",
  url: "/interview/coding/134-gas-station",
  status: "published",
  context: "coding",
};

function makeEditor(content = ""): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: createExtensions({ placeholder: "" }),
    content,
    contentType: "markdown",
  });
}

describe("insertArticleLink", () => {
  it("replaces a mid-sentence @query without doubling the following space", () => {
    const editor = makeEditor("see @gas here");
    // "see @gas here" → doc positions: "@gas" spans 5..9 (1-based content).
    insertArticleLink(editor, { from: 5, to: 9 }, gasStation);
    expect(editor.getMarkdown()).toBe(
      "see [134. Gas Station](/interview/coding/134-gas-station) here",
    );
  });

  it("appends an unlinked trailing space at the end of a line", () => {
    const editor = makeEditor("see @gas");
    insertArticleLink(editor, { from: 5, to: 9 }, gasStation);
    // Trailing space is plain text (outside the link), so typing continues
    // unlinked.
    expect(editor.getMarkdown()).toBe("see [134. Gas Station](/interview/coding/134-gas-station) ");
    const para = editor.getJSON().content?.[0];
    const last = para?.content?.at(-1) as { text?: string; marks?: unknown[] } | undefined;
    expect(last?.text).toBe(" ");
    expect(last?.marks).toBeUndefined();
  });
});

describe("LinkSuggestionList", () => {
  it("renders results and lets Enter pick the active row", () => {
    const command = vi.fn();
    const ref = createRef<LinkSuggestionListHandle>();
    render(
      <LinkSuggestionList
        ref={ref}
        items={[gasStation, { ...gasStation, title: "Other", url: "/posts/other", type: "post" }]}
        loading={false}
        query="gas"
        command={command}
      />,
    );
    expect(screen.getByText("134. Gas Station")).toBeDefined();

    act(() => void ref.current!.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowDown" })));
    act(() => void ref.current!.onKeyDown(new KeyboardEvent("keydown", { key: "Enter" })));
    expect(command).toHaveBeenCalledWith(expect.objectContaining({ url: "/posts/other" }));
  });

  it("clicking a row picks it", () => {
    const command = vi.fn();
    render(
      <LinkSuggestionList items={[gasStation]} loading={false} query="gas" command={command} />,
    );
    fireEvent.click(screen.getByText("134. Gas Station"));
    expect(command).toHaveBeenCalledWith(expect.objectContaining({ url: gasStation.url }));
  });

  it("shows the type-to-search hint before any query", () => {
    render(<LinkSuggestionList items={[]} loading={false} query="" command={() => {}} />);
    expect(screen.getByText("editor.linkSuggestHint")).toBeDefined();
  });
});
