// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";
import { DeleteTagButton } from "@/components/admin/DeleteTagButton";

const { deleteTagFn, invalidate, toast } = vi.hoisted(() => ({
  deleteTagFn: vi.fn(),
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/server/admin/tags", () => ({ deleteTagFn }));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ invalidate }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

const tag = { id: "t1", name: "go", postCount: 2, noteCount: 0, usedBy: [] };

async function openAndConfirm() {
  fireEvent.click(screen.getByRole("button", { name: "tagList.delete" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "tagList.delete" }));
}

describe("DeleteTagButton", () => {
  it("calls deleteTagFn and invalidates on success", async () => {
    deleteTagFn.mockResolvedValue({ ok: true });
    render(<DeleteTagButton tag={tag} />);

    await openAndConfirm();

    await waitFor(() => expect(deleteTagFn).toHaveBeenCalledWith({ data: { id: "t1" } }));
    expect(toast.success).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalled();
  });

  it("shows an error toast and does not invalidate on failure", async () => {
    deleteTagFn.mockResolvedValue({ ok: false, error: "nope" });
    render(<DeleteTagButton tag={tag} />);

    await openAndConfirm();

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(invalidate).not.toHaveBeenCalled();
  });
});
