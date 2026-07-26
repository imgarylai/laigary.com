// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { PageForm } from "@/components/admin/PageForm";

const { upsertPageFn, navigate, invalidate, toast } = vi.hoisted(() => ({
  upsertPageFn: vi.fn(),
  navigate: vi.fn(),
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/server/admin/pages", () => ({ upsertPageFn }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useRouter: () => ({ invalidate }),
}));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ t: (k: string) => k, locale: "en" }) }));
// Stub the heavy lazy editor with a plain textarea.
vi.mock("@/components/admin/TiptapEditor", () => ({
  TiptapEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea data-testid="editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("PageForm", () => {
  it("upserts a new page (auto-slug from title) and navigates to its editor", async () => {
    upsertPageFn.mockResolvedValue({ ok: true });
    render(<PageForm />);

    fireEvent.change(screen.getByLabelText("pageForm.title"), { target: { value: "My Page" } });
    fireEvent.click(screen.getByRole("button", { name: "pageForm.create" }));

    await waitFor(() =>
      expect(upsertPageFn).toHaveBeenCalledWith({
        data: { slug: "my-page", title: "My Page", contentMd: "" },
      }),
    );
    expect(toast.success).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith({
      to: "/admin/pages/$slug/edit",
      params: { slug: "my-page" },
    });
  });

  it("shows an error toast when the upsert fails", async () => {
    upsertPageFn.mockResolvedValue({ ok: false, error: "boom" });
    render(<PageForm />);

    fireEvent.change(screen.getByLabelText("pageForm.title"), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: "pageForm.create" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("boom"));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("should keep the slug in the settings sheet, off the writing surface", async () => {
    render(<PageForm />);

    expect(screen.queryByLabelText("pageForm.slug")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "pageForm.settings" }));

    expect(await screen.findByLabelText("pageForm.slug")).toBeTruthy();
  });

  it("should leave the editor for the list when cancelled", () => {
    render(<PageForm />);

    fireEvent.click(screen.getByRole("button", { name: "pageForm.cancel" }));

    expect(navigate).toHaveBeenCalledWith({ to: "/admin/pages" });
  });

  it("should toggle the preview from the bar", () => {
    render(<PageForm />);

    fireEvent.click(screen.getByRole("button", { name: /postForm.showPreview/ }));

    expect(screen.getByRole("button", { name: /postForm.hidePreview/ })).toBeTruthy();
  });

  it("should save on Cmd/Ctrl+S", async () => {
    upsertPageFn.mockResolvedValue({ ok: true });
    render(<PageForm />);

    fireEvent.change(screen.getByLabelText("pageForm.title"), { target: { value: "Shortcut" } });
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });

    await waitFor(() => expect(upsertPageFn).toHaveBeenCalledTimes(1));
  });
});
