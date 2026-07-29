// @vitest-environment jsdom
//
// The works editor. Same writing surface as the post editor — title and body
// only — with the portfolio metadata (year range, role, links, stack) in the
// settings sheet.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { WorkForm } from "@/components/admin/WorkForm";

const { createWorkFn, updateWorkFn, navigate, invalidate, toast } = vi.hoisted(() => ({
  createWorkFn: vi.fn(),
  updateWorkFn: vi.fn(),
  navigate: vi.fn(),
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/server/admin/works", () => ({ createWorkFn, updateWorkFn }));
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
  TiptapEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="body" value={value} onChange={(e) => onChange(e.target.value)} />
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

const existingWork = {
  id: "w1",
  title: "Original",
  slug: "original-slug",
  summary: "one liner",
  contentMd: "body",
  coverImageUrl: null,
  projectUrl: null,
  repoUrl: null,
  role: null,
  year: 2021,
  endYear: 2023,
  status: "draft" as const,
  pinned: false,
  tagIds: [],
};

function openSettings() {
  fireEvent.click(screen.getByRole("button", { name: "workForm.settings" }));
}

describe("WorkForm", () => {
  it("should put the portfolio metadata in the settings sheet", () => {
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    // The writing surface stays title + body.
    expect(screen.queryByLabelText("workForm.year")).toBeNull();

    openSettings();

    expect(screen.getByLabelText("workForm.summary")).toBeTruthy();
    expect(screen.getByLabelText("workForm.year")).toBeTruthy();
    expect(screen.getByLabelText("workForm.endYear")).toBeTruthy();
    expect(screen.getByLabelText("workForm.role")).toBeTruthy();
    expect(screen.getByLabelText("workForm.projectUrl")).toBeTruthy();
    expect(screen.getByLabelText("workForm.repoUrl")).toBeTruthy();
    expect(screen.getByText("workForm.stack")).toBeTruthy();
  });

  it("should default the year to the current one so the NOT NULL column is never empty", () => {
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    openSettings();

    const year = screen.getByLabelText("workForm.year") as HTMLInputElement;
    expect(year.value).toBe(String(new Date().getFullYear()));
  });

  it("should auto-fill the slug from the title on a new work", async () => {
    createWorkFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "My New Work" } });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(createWorkFn).toHaveBeenCalledTimes(1));
    expect(createWorkFn.mock.calls[0][0].data.slug).toBe("my-new-work");
    expect(navigate).toHaveBeenCalledWith({
      to: "/admin/works/$workId/edit",
      params: { workId: "new-id" },
    });
  });

  it("should submit the year as a number, not the string the input hands back", async () => {
    // The column is INTEGER; a "2019" string would either fail the insert or
    // store text that sorts lexicographically.
    createWorkFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Dated" } });
    openSettings();
    fireEvent.change(screen.getByLabelText("workForm.year"), { target: { value: "2019" } });
    fireEvent.keyDown(document.body, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(createWorkFn).toHaveBeenCalledTimes(1));
    expect(createWorkFn.mock.calls[0][0].data.year).toBe(2019);
  });

  it("should send a blank end year as null so the range collapses to one year", async () => {
    // undefined would leave whatever is stored alone; null is what the query
    // layer reads as "clear it".
    createWorkFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Single" } });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(createWorkFn).toHaveBeenCalledTimes(1));
    expect(createWorkFn.mock.calls[0][0].data.endYear).toBeNull();
  });

  it("should submit an end year as a number when one is given", async () => {
    createWorkFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Ranged" } });
    openSettings();
    fireEvent.change(screen.getByLabelText("workForm.year"), { target: { value: "2021" } });
    fireEvent.change(screen.getByLabelText("workForm.endYear"), { target: { value: "2023" } });
    fireEvent.keyDown(document.body, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(createWorkFn).toHaveBeenCalledTimes(1));
    expect(createWorkFn.mock.calls[0][0].data.endYear).toBe(2023);
  });

  it("should accept a work with a live url and no repo", async () => {
    // Not every work is open source — a blank repo field must not be treated
    // as an invalid URL.
    createWorkFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Site" } });
    openSettings();
    fireEvent.change(screen.getByLabelText("workForm.projectUrl"), {
      target: { value: "https://example.com" },
    });
    fireEvent.keyDown(document.body, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(createWorkFn).toHaveBeenCalledTimes(1));
    const arg = createWorkFn.mock.calls[0][0].data;
    expect(arg.projectUrl).toBe("https://example.com");
    expect(arg.repoUrl).toBe("");
  });

  it("should refuse to save a malformed project url", async () => {
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Bad" } });
    openSettings();
    fireEvent.change(screen.getByLabelText("workForm.projectUrl"), {
      target: { value: "not-a-url" },
    });
    fireEvent.keyDown(document.body, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    openSettings();
    await waitFor(() => expect(screen.getByText("Must be a valid URL")).toBeTruthy());
    expect(createWorkFn).not.toHaveBeenCalled();
  });

  it("should report a failed save and stay on the editor", async () => {
    createWorkFn.mockResolvedValue({ ok: false, error: "boom" });
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("boom"));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("should report a failed save on an existing work and stay on the editor", async () => {
    // The create path has its own failure branch; this is the update one, and
    // getting it wrong loses the author's edit behind a success toast.
    updateWorkFn.mockResolvedValue({ ok: false, error: "boom" });
    render(<WorkForm work={existingWork} availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Renamed" } });
    fireEvent.click(screen.getByRole("button", { name: "postForm.update" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("boom"));
    expect(invalidate).not.toHaveBeenCalled();
    // Clearing the flag here would tell the author their work is safe when it
    // is not.
    expect(screen.getByText("postForm.unsavedChanges")).toBeTruthy();
  });

  it("should leave an existing work's slug alone when its title is edited", async () => {
    updateWorkFn.mockResolvedValue({ ok: true, data: { id: "w1", slug: "original-slug" } });
    render(<WorkForm work={existingWork} availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Renamed" } });
    fireEvent.click(screen.getByRole("button", { name: "postForm.update" }));

    // Rewriting the slug would break the work's public URL.
    await waitFor(() => expect(updateWorkFn).toHaveBeenCalledTimes(1));
    expect(updateWorkFn.mock.calls[0][0].data.slug).toBe("original-slug");
    expect(invalidate).toHaveBeenCalled();
  });

  it("should load a stored end year back into the form", async () => {
    updateWorkFn.mockResolvedValue({ ok: true, data: { id: "w1", slug: "original-slug" } });
    render(<WorkForm work={existingWork} availableTags={tags} ogBrand="Unconstrained" />);

    openSettings();
    expect((screen.getByLabelText("workForm.endYear") as HTMLInputElement).value).toBe("2023");
  });

  it("should publish and pin from the settings switches", async () => {
    createWorkFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Live" } });
    openSettings();
    fireEvent.click(screen.getByRole("switch", { name: "postForm.published" }));
    fireEvent.click(screen.getByRole("switch", { name: "postForm.pinned" }));
    fireEvent.keyDown(document.body, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(createWorkFn).toHaveBeenCalledTimes(1));
    const arg = createWorkFn.mock.calls[0][0].data;
    expect(arg.status).toBe("published");
    expect(arg.pinned).toBe(true);
  });

  it("should refuse to save a work with no title", async () => {
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.click(screen.getByRole("button", { name: "postForm.create" }));

    await waitFor(() => expect(screen.getByText("Title is required")).toBeTruthy());
    expect(createWorkFn).not.toHaveBeenCalled();
  });

  it("should leave the editor for the list when cancelled", () => {
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.click(screen.getByRole("button", { name: "postForm.cancel" }));

    expect(navigate).toHaveBeenCalledWith({ to: "/admin/works" });
  });

  it("should clear the unsaved flag once the save lands", async () => {
    // The reset after a successful save is what does this, and it is also what
    // stops the navigation guard blocking the editor's own redirect.
    updateWorkFn.mockResolvedValue({ ok: true, data: { id: "w1", slug: "original-slug" } });
    render(<WorkForm work={existingWork} availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Renamed" } });
    expect(screen.getByText("postForm.unsavedChanges")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "postForm.update" }));

    await waitFor(() => expect(screen.getByText("postForm.allSaved")).toBeTruthy());
    expect(screen.queryByText("postForm.unsavedChanges")).toBeNull();
  });

  it("should save on Cmd/Ctrl+S without reaching for the button", async () => {
    createWorkFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<WorkForm availableTags={tags} ogBrand="Unconstrained" />);

    fireEvent.change(screen.getByLabelText("postForm.title"), { target: { value: "Shortcut" } });
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });

    await waitFor(() => expect(createWorkFn).toHaveBeenCalledTimes(1));
  });
});
