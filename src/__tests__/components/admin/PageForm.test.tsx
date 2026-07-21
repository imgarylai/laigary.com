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
});
