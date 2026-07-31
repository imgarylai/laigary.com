// @vitest-environment jsdom
//
// Pages were the one content type with no delete path at all — not in the query
// layer, not at the RPC boundary, not in the UI. These mirror the work dialog's
// tests so the new path is held to the same contract.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";
import { DeletePageDialog } from "@/components/admin/DeletePageDialog";

// Hoisted so the (hoisted) vi.mock factories below can reference them.
const { deletePageFn, invalidate, toast } = vi.hoisted(() => ({
  deletePageFn: vi.fn(),
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/server/admin/pages", () => ({ deletePageFn }));
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
  fireEvent.click(within(dialog).getByRole("button", { name: "deletePage.delete" }));
}

describe("DeletePageDialog", () => {
  it("should delete by slug and invalidate the route on success", async () => {
    // Slug, not id: that is the key the page routes and the upsert both use.
    deletePageFn.mockResolvedValue({ ok: true });
    render(<DeletePageDialog pageSlug="about" pageTitle="About" open onOpenChange={() => {}} />);

    await confirm();

    await waitFor(() => expect(deletePageFn).toHaveBeenCalledWith({ data: { slug: "about" } }));
    expect(toast.success).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalled();
  });

  it("should show an error toast and not invalidate when the delete fails", async () => {
    deletePageFn.mockResolvedValue({ ok: false, error: "nope" });
    render(<DeletePageDialog pageSlug="now" pageTitle="Now" open onOpenChange={() => {}} />);

    await confirm();

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("should close without deleting when cancelled", async () => {
    // The row's menu owns the open state, so cancelling has to hand it back.
    const onOpenChange = vi.fn();
    render(
      <DeletePageDialog pageSlug="keep" pageTitle="Keep me" open onOpenChange={onOpenChange} />,
    );

    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "deletePage.cancel",
      }),
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(deletePageFn).not.toHaveBeenCalled();
  });

  it("should name the page being deleted in the confirmation", async () => {
    // The `{title}` interpolation is the only thing distinguishing this dialog
    // from a generic "are you sure"; a broken placeholder is silent otherwise.
    render(<DeletePageDialog pageSlug="about" pageTitle="About Me" open onOpenChange={vi.fn()} />);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/deletePage.confirmMessage/)).toBeTruthy();
  });
});
