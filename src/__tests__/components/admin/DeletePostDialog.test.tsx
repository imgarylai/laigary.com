// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";
import { DeletePostDialog } from "@/components/admin/DeletePostDialog";

// Hoisted so the (hoisted) vi.mock factories below can reference them.
const { deletePostFn, invalidate, toast } = vi.hoisted(() => ({
  deletePostFn: vi.fn(),
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock the server function (the RPC boundary) — component tests assert the
// component drives it correctly, not the server behaviour.
vi.mock("@/server/admin/posts", () => ({ deletePostFn }));
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
  fireEvent.click(within(dialog).getByRole("button", { name: "deletePost.delete" }));
}

describe("DeletePostDialog", () => {
  it("calls deletePostFn and invalidates the route on success", async () => {
    deletePostFn.mockResolvedValue({ ok: true });
    render(<DeletePostDialog postId="p1" postTitle="Hello" open onOpenChange={() => {}} />);

    await confirm();

    await waitFor(() => expect(deletePostFn).toHaveBeenCalledWith({ data: { id: "p1" } }));
    expect(toast.success).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalled();
  });

  it("shows an error toast and does not invalidate on failure", async () => {
    deletePostFn.mockResolvedValue({ ok: false, error: "nope" });
    render(<DeletePostDialog postId="p2" postTitle="X" open onOpenChange={() => {}} />);

    await confirm();

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(invalidate).not.toHaveBeenCalled();
  });
});
