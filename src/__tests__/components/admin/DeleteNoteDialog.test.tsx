// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";
import { DeleteNoteDialog } from "@/components/admin/DeleteNoteDialog";

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

/** The dialog is opened by the row's ⋯ menu, so tests render it already open. */
async function confirm() {
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "noteList.delete" }));
}

describe("DeleteNoteDialog", () => {
  it("calls deleteNoteFn and invalidates on success", async () => {
    deleteNoteFn.mockResolvedValue({ ok: true });
    render(<DeleteNoteDialog noteId="n1" noteTitle="Two Sum" open onOpenChange={() => {}} />);

    await confirm();

    await waitFor(() => expect(deleteNoteFn).toHaveBeenCalledWith({ data: { id: "n1" } }));
    expect(toast.success).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalled();
  });

  it("shows an error toast and does not invalidate on failure", async () => {
    deleteNoteFn.mockResolvedValue({ ok: false, error: "nope" });
    render(<DeleteNoteDialog noteId="n2" noteTitle="X" open onOpenChange={() => {}} />);

    await confirm();

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("closes without deleting when cancelled", async () => {
    // The row's menu owns the open state, so cancelling has to hand it back.
    const onOpenChange = vi.fn();
    render(<DeleteNoteDialog noteId="c1" noteTitle="Keep me" open onOpenChange={onOpenChange} />);

    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "noteForm.cancel",
      }),
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(deleteNoteFn).not.toHaveBeenCalled();
  });
});
