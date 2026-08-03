// @vitest-environment jsdom
//
// The post editor. Since #174 the writing surface is only the title and the
// body; slug, excerpt, status, pinned, tags and cover live in a settings sheet.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { PostForm } from "@/components/admin/PostForm";

const { createPostFn, updatePostFn, navigate, invalidate, toast } = vi.hoisted(() => ({
  createPostFn: vi.fn(),
  updatePostFn: vi.fn(),
  navigate: vi.fn(),
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/server/admin/posts", () => ({ createPostFn, updatePostFn }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  // The editor's navigation guard calls this; an idle resolver means nothing is
  // currently blocked, which is the state every test here starts in.
  useBlocker: () => ({ status: "idle" }),
  useRouter: () => ({ invalidate }),
  Link: ({ children }: { children?: React.ReactNode }) => <a href="/">{children}</a>,
}));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));
// The editor is lazy + client-only and drags in the whole Tiptap chunk; the
// form's own behaviour is what matters here.
vi.mock("@/components/admin/TiptapEditor", () => ({
  TiptapEditor: ({
    value,
    onChange,
    showPreview,
  }: {
    value: string;
    onChange: (v: string) => void;
    showPreview: boolean;
  }) => (
    <textarea
      data-testid="editor"
      data-preview={String(showPreview)}
      aria-label="body"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

const tags = [{ id: "tag-1", name: "go", slug: "go" }];

function openSettings() {
  fireEvent.click(screen.getByRole("button", { name: "postForm.settings" }));
}

describe("PostForm", () => {
  it("should show only the title and the body on the writing surface", () => {
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    expect(screen.getByLabelText("postForm.title")).toBeTruthy();
    expect(screen.getByTestId("editor")).toBeTruthy();
    // Metadata is one click away, not stacked above the article.
    expect(screen.queryByLabelText("postForm.slug")).toBeNull();
    expect(screen.queryByLabelText("postForm.excerpt")).toBeNull();
  });

  it("should put the metadata fields in the settings sheet", () => {
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    openSettings();

    expect(screen.getByLabelText("postForm.slug")).toBeTruthy();
    expect(screen.getByLabelText("postForm.excerpt")).toBeTruthy();
    expect(screen.getByText("postForm.tags")).toBeTruthy();
    expect(screen.getByText("postForm.coverImage")).toBeTruthy();
  });

  it("should auto-fill the slug from the title on a new post", async () => {
    createPostFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), {
      target: { value: "My New Post" },
    });
    fireEvent.change(screen.getByLabelText("body"), { target: { value: "the body" } });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(createPostFn).toHaveBeenCalledTimes(1));
    expect(createPostFn.mock.calls[0][0].data.slug).toBe("my-new-post");
    expect(navigate).toHaveBeenCalledWith({
      to: "/admin/posts/$postId/edit",
      params: { postId: "new-id" },
    });
  });

  it("should report a failed save and stay on the editor", async () => {
    createPostFn.mockResolvedValue({ ok: false, error: "boom" });
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("body"), { target: { value: "the body" } });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("boom"));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("should leave an existing post's slug alone when its title is edited", async () => {
    updatePostFn.mockResolvedValue({ ok: true });
    render(
      <PostForm
        postId="p1"
        availableTags={tags}
        ogBrand="Unconstrained"
        initialData={{
          title: "Original",
          slug: "original-slug",
          contentMd: "body",
          excerpt: "",
          coverImageUrl: "",
          tagIds: [],
          status: "draft",
          pinned: false,
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Renamed" } });
    fireEvent.click(screen.getByRole("button", { name: "postForm.update" }));

    // Rewriting the slug would break the post's public URL.
    await waitFor(() => expect(updatePostFn).toHaveBeenCalledTimes(1));
    expect(updatePostFn.mock.calls[0][0].data.slug).toBe("original-slug");
    expect(invalidate).toHaveBeenCalled();
  });

  it("should publish and pin from the settings switches", async () => {
    // Status is a switch rather than a two-option select, so this is the only
    // way it gets set.
    createPostFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Live" } });
    fireEvent.change(screen.getByLabelText("body"), { target: { value: "the body" } });
    openSettings();
    fireEvent.click(screen.getByRole("switch", { name: "postForm.published" }));
    fireEvent.click(screen.getByRole("switch", { name: "postForm.pinned" }));
    fireEvent.keyDown(document.body, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(createPostFn).toHaveBeenCalledTimes(1));
    const arg = createPostFn.mock.calls[0][0].data;
    expect(arg.status).toBe("published");
    expect(arg.pinned).toBe(true);
  });

  it("should say nothing about saving before the author touches anything", () => {
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    // A new post has nothing stored, so "Saved" would be a lie.
    expect(screen.queryByText("postForm.unsavedChanges")).toBeNull();
    expect(screen.queryByText("postForm.allSaved")).toBeNull();
  });

  it("should flag unsaved changes as soon as a field is edited", () => {
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Draft" } });

    expect(screen.getByText("postForm.unsavedChanges")).toBeTruthy();
  });

  it("should clear the unsaved flag once the save lands", async () => {
    // The reset after a successful save is what does this, and it is also what
    // stops the navigation guard blocking the editor's own redirect.
    updatePostFn.mockResolvedValue({ ok: true });
    render(
      <PostForm
        postId="p1"
        availableTags={tags}
        ogBrand="Unconstrained"
        initialData={{
          title: "Original",
          slug: "original-slug",
          contentMd: "body",
          excerpt: "",
          coverImageUrl: "",
          tagIds: [],
          status: "draft",
          pinned: false,
        }}
      />,
    );
    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Renamed" } });
    expect(screen.getByText("postForm.unsavedChanges")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "postForm.update" }));

    await waitFor(() => expect(screen.getByText("postForm.allSaved")).toBeTruthy());
    expect(screen.queryByText("postForm.unsavedChanges")).toBeNull();
  });

  it("should keep the unsaved flag up when the save fails", async () => {
    // Clearing it here would tell the author their work is safe when it is not.
    updatePostFn.mockResolvedValue({ ok: false, error: "boom" });
    render(
      <PostForm
        postId="p1"
        availableTags={tags}
        ogBrand="Unconstrained"
        initialData={{
          title: "Original",
          slug: "original-slug",
          contentMd: "body",
          excerpt: "",
          coverImageUrl: "",
          tagIds: [],
          status: "draft",
          pinned: false,
        }}
      />,
    );
    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Renamed" } });

    fireEvent.click(screen.getByRole("button", { name: "postForm.update" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("boom"));
    expect(screen.getByText("postForm.unsavedChanges")).toBeTruthy();
  });

  it("should advertise the save shortcut on the button", () => {
    // ⌘S has worked all along, but nothing on screen said so.
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    expect(screen.getByRole("button", { name: "postForm.create" }).getAttribute("title")).toContain(
      "⌘S",
    );
  });

  it("should leave the editor for the list when cancelled", () => {
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.click(screen.getByRole("button", { name: "postForm.cancel" }));

    expect(navigate).toHaveBeenCalledWith({ to: "/admin/posts" });
  });

  it("should save on Cmd/Ctrl+S without reaching for the button", async () => {
    createPostFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Shortcut" } });
    fireEvent.change(screen.getByLabelText("body"), { target: { value: "the body" } });
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });

    await waitFor(() => expect(createPostFn).toHaveBeenCalledTimes(1));
  });

  it("should pass the shell's preview state down to the editor", () => {
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    expect(screen.getByTestId("editor").dataset.preview).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: /postForm.showPreview/ }));

    expect(screen.getByTestId("editor").dataset.preview).toBe("true");
  });

  it("should keep updating the slug as the title is typed out", async () => {
    // A title arrives one keystroke at a time, not in one `change`. The guard
    // used to be `!formState.dirtyFields.slug`, which react-hook-form flips to
    // true on the keystroke after the first auto-fill (it re-diffs the whole
    // form against defaultValues), so the slug froze two characters in:
    // "十年部落格如一日" saved as "shih".
    createPostFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    const title = screen.getByLabelText("postForm.title");
    openSettings();
    const slug = screen.getByLabelText("postForm.slug") as HTMLInputElement;

    for (const typed of ["十", "十年", "十年部", "十年部落", "十年部落格"]) {
      fireEvent.change(title, { target: { value: typed } });
    }
    expect(slug.value).toBe("shih-nien-pu-lo-ko");

    fireEvent.keyDown(document.body, { key: "Escape" });
    fireEvent.change(screen.getByLabelText("body"), { target: { value: "the body" } });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(createPostFn).toHaveBeenCalledTimes(1));
    expect(createPostFn.mock.calls[0][0].data.slug).toBe("shih-nien-pu-lo-ko");
  });

  it("should stop auto-filling the slug once the author has edited it by hand", async () => {
    // The guard is `enabled && the slug is still ours` — the edit-mode half is
    // covered above, this is the hand-edited half. Without it, renaming the
    // title would silently throw away a hand-picked slug on a new post.
    createPostFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    const title = screen.getByLabelText("postForm.title");
    fireEvent.change(title, { target: { value: "First Title" } });
    fireEvent.change(screen.getByLabelText("body"), { target: { value: "the body" } });

    openSettings();
    const slug = screen.getByLabelText("postForm.slug") as HTMLInputElement;
    expect(slug.value).toBe("first-title");
    fireEvent.change(slug, { target: { value: "hand-picked" } });
    fireEvent.keyDown(document.body, { key: "Escape" });

    fireEvent.change(title, { target: { value: "Second Title" } });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(createPostFn).toHaveBeenCalledTimes(1));
    expect(createPostFn.mock.calls[0][0].data.slug).toBe("hand-picked");
  });

  it("should refuse to save a post with no title", async () => {
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("body"), { target: { value: "the body" } });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(screen.getByText("Title is required")).toBeTruthy());
    expect(createPostFn).not.toHaveBeenCalled();
  });
});
