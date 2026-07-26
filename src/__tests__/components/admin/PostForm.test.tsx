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

  it("should pass the shell's preview state down to the editor", () => {
    render(<PostForm availableTags={tags} ogBrand="Unconstrained" />);

    expect(screen.getByTestId("editor").dataset.preview).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: /postForm.showPreview/ }));

    expect(screen.getByTestId("editor").dataset.preview).toBe("true");
  });
});
