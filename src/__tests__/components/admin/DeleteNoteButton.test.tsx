// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";
import { DeleteNoteButton } from "@/components/admin/DeleteNoteButton";

const { deleteNoteFn, invalidate, toast } = vi.hoisted(() => ({
  deleteNoteFn: vi.fn(),
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/server/admin/interview", () => ({ deleteNoteFn }));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ invalidate }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

async function openAndConfirm() {
  fireEvent.click(screen.getByRole("button", { name: "noteList.delete" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "noteList.delete" }));
}

describe("DeleteNoteButton", () => {
  it("calls deleteNoteFn and invalidates on success", async () => {
    deleteNoteFn.mockResolvedValue({ ok: true });
    render(<DeleteNoteButton noteId="n1" noteTitle="Two Sum" />);

    await openAndConfirm();

    await waitFor(() => expect(deleteNoteFn).toHaveBeenCalledWith({ data: { id: "n1" } }));
    expect(toast.success).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalled();
  });

  it("shows an error toast and does not invalidate on failure", async () => {
    deleteNoteFn.mockResolvedValue({ ok: false, error: "nope" });
    render(<DeleteNoteButton noteId="n2" noteTitle="X" />);

    await openAndConfirm();

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(invalidate).not.toHaveBeenCalled();
  });
});
