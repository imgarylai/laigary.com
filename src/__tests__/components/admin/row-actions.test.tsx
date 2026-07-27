// @vitest-environment jsdom
//
// The `⋯` row menu and the click guard behind the clickable row (#180). Every
// row used to carry a filled red Delete button, and the only way to open a post
// was to hit the title text exactly.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { isSelfHandledTarget } from "@/components/admin/DataTable";
import { PostRowActions } from "@/components/admin/PostRowActions";
import { NoteRowActions } from "@/components/admin/NoteRowActions";

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
  Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/server/admin/posts", () => ({ deletePostFn: vi.fn() }));
vi.mock("@/server/admin/interview", () => ({ deleteNoteFn: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function renderActions(published = true) {
  render(<PostRowActions postId="p1" postSlug="hello" postTitle="Hello" published={published} />);
}

const openMenu = () => fireEvent.click(screen.getByRole("button", { name: "postList.actions" }));

describe("isSelfHandledTarget", () => {
  it.each([
    ["a link", "<a href='/x'>go</a>"],
    ["a button", "<button>press</button>"],
    ["an input", "<input />"],
    ["a menu item", "<div role='menuitem'>item</div>"],
    ["a dialog", "<div role='dialog'>confirm</div>"],
  ])("should decline to activate the row from %s", (_name, html) => {
    // The row navigates to the editor; each of these already does something of
    // its own, and doing both would be wrong every time.
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);

    expect(isSelfHandledTarget(host.firstElementChild)).toBe(true);
  });

  it("should activate the row from inert cell content", () => {
    const host = document.createElement("div");
    host.innerHTML = "<span>Just a title</span>";
    document.body.append(host);

    expect(isSelfHandledTarget(host.firstElementChild)).toBe(false);
  });

  it("should catch a click on something nested inside a link", () => {
    // Clicks usually land on the icon or text inside the control, not the
    // control itself, which is why this walks up rather than checking the node.
    const host = document.createElement("div");
    host.innerHTML = "<a href='/x'><svg><title>icon</title></svg></a>";
    document.body.append(host);

    expect(isSelfHandledTarget(host.querySelector("svg"))).toBe(true);
  });

  it("should handle a null target", () => {
    expect(isSelfHandledTarget(null)).toBe(false);
  });
});

describe("PostRowActions", () => {
  it("should keep the actions behind a menu rather than on the row", () => {
    renderActions();

    // Nothing destructive on screen until asked for.
    expect(screen.queryByText("deletePost.delete")).toBeNull();
    expect(screen.getByRole("button", { name: "postList.actions" })).toBeTruthy();
  });

  it("should offer edit, view and delete for a published post", async () => {
    renderActions(true);

    openMenu();

    expect(await screen.findByRole("menuitem", { name: /postList.edit/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /postList.view/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /deletePost.delete/ })).toBeTruthy();
  });

  it("should not offer to view a draft", async () => {
    // Drafts have no public page, so the link would 404.
    renderActions(false);

    openMenu();

    expect(await screen.findByRole("menuitem", { name: /postList.edit/ })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: /postList.view/ })).toBeNull();
  });

  it("should confirm before deleting", async () => {
    renderActions();
    openMenu();

    fireEvent.click(await screen.findByRole("menuitem", { name: /deletePost.delete/ }));

    // The menu closing must not take the confirmation with it — which is why
    // the dialog is a sibling of the menu rather than a child.
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("deletePost.deletePost")).toBeTruthy();
  });

  it("should not let opening the menu also open the post", () => {
    // The row's own click handler would otherwise fire on the way past.
    const onRowClick = vi.fn();
    render(
      <div onClick={onRowClick}>
        <PostRowActions postId="p2" postSlug="x" postTitle="X" published />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "postList.actions" }));

    expect(onRowClick).not.toHaveBeenCalled();
  });
});

describe("NoteRowActions", () => {
  // The notes list gets the same treatment as posts (AGENTS.md), so it gets the
  // same proof rather than being assumed to follow.
  function renderNoteActions(published = true) {
    render(
      <NoteRowActions
        noteId="n1"
        noteSlug="two-sum"
        noteTitle="Two Sum"
        sectionSlug="arrays"
        published={published}
      />,
    );
  }

  it("should keep the actions behind a menu", () => {
    renderNoteActions();

    expect(screen.queryByText("noteList.delete")).toBeNull();
    expect(screen.getByRole("button", { name: "noteList.actions" })).toBeTruthy();
  });

  it("should offer edit, view and delete for a published note", async () => {
    renderNoteActions(true);

    fireEvent.click(screen.getByRole("button", { name: "noteList.actions" }));

    expect(await screen.findByRole("menuitem", { name: /postList.edit/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /noteList.view/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /noteList.delete/ })).toBeTruthy();
  });

  it("should not offer to view a draft note", async () => {
    renderNoteActions(false);

    fireEvent.click(screen.getByRole("button", { name: "noteList.actions" }));

    expect(await screen.findByRole("menuitem", { name: /postList.edit/ })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: /noteList.view/ })).toBeNull();
  });

  it("should confirm before deleting a note", async () => {
    renderNoteActions();
    fireEvent.click(screen.getByRole("button", { name: "noteList.actions" }));

    fireEvent.click(await screen.findByRole("menuitem", { name: /noteList.delete/ }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("noteList.deleteTitle")).toBeTruthy();
  });
});
