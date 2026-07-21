// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";
import { DeleteSectionButton } from "@/components/admin/DeleteSectionButton";

const { deleteSectionFn, invalidate, toast } = vi.hoisted(() => ({
  deleteSectionFn: vi.fn(),
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/server/admin/interview", () => ({ deleteSectionFn }));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ invalidate }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

const section = { id: "s1", label: "LeetCode", noteCount: 3 };

async function openAndConfirm() {
  fireEvent.click(screen.getByRole("button", { name: "sectionList.delete" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "sectionList.delete" }));
}

describe("DeleteSectionButton", () => {
  it("calls deleteSectionFn and invalidates on success", async () => {
    deleteSectionFn.mockResolvedValue({ ok: true });
    render(<DeleteSectionButton section={section} />);

    await openAndConfirm();

    await waitFor(() => expect(deleteSectionFn).toHaveBeenCalledWith({ data: { id: "s1" } }));
    expect(toast.success).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalled();
  });

  it("shows an error toast and does not invalidate on failure", async () => {
    deleteSectionFn.mockResolvedValue({ ok: false, error: "nope" });
    render(<DeleteSectionButton section={section} />);

    await openAndConfirm();

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(invalidate).not.toHaveBeenCalled();
  });
});
