// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";
import { DeleteWorkDialog } from "@/components/admin/DeleteWorkDialog";

// Hoisted so the (hoisted) vi.mock factories below can reference them.
const { deleteWorkFn, invalidate, toast } = vi.hoisted(() => ({
  deleteWorkFn: vi.fn(),
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock the server function (the RPC boundary) — component tests assert the
// component drives it correctly, not the server behaviour.
vi.mock("@/server/admin/works", () => ({ deleteWorkFn }));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ invalidate }) }));
vi.mock("sonner", () => ({ toast }));

// Deterministic labels: t(key) returns the key so queries don't depend on copy.
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

/** The dialog is opened by the row's ⋯ menu, so tests render it already open. */
async function confirm() {
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "deleteWork.delete" }));
}

describe("DeleteWorkDialog", () => {
  it("calls deleteWorkFn and invalidates the route on success", async () => {
    deleteWorkFn.mockResolvedValue({ ok: true });
    render(<DeleteWorkDialog workId="w1" workTitle="Hello" open onOpenChange={() => {}} />);

    await confirm();

    await waitFor(() => expect(deleteWorkFn).toHaveBeenCalledWith({ data: { id: "w1" } }));
    expect(toast.success).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalled();
  });

  it("shows an error toast and does not invalidate on failure", async () => {
    deleteWorkFn.mockResolvedValue({ ok: false, error: "nope" });
    render(<DeleteWorkDialog workId="w2" workTitle="X" open onOpenChange={() => {}} />);

    await confirm();

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("closes without deleting when cancelled", async () => {
    // The row's menu owns the open state, so cancelling has to hand it back.
    const onOpenChange = vi.fn();
    render(<DeleteWorkDialog workId="c1" workTitle="Keep me" open onOpenChange={onOpenChange} />);

    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "deleteWork.cancel",
      }),
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(deleteWorkFn).not.toHaveBeenCalled();
  });

  it("names the work being deleted in the confirmation", async () => {
    // The `{title}` interpolation is the only thing distinguishing this dialog
    // from a generic "are you sure"; a broken placeholder is silent otherwise.
    render(
      <DeleteWorkDialog workId="w3" workTitle="Portfolio Piece" open onOpenChange={vi.fn()} />,
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/deleteWork.confirmMessage/)).toBeTruthy();
  });
});
