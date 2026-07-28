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

async function open() {
  fireEvent.click(screen.getByRole("button", { name: "sectionList.delete" }));
  return screen.findByRole("dialog");
}

async function openAndConfirm() {
  const dialog = await open();
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

// Deleting a section cascades to every note under it (FK onDelete: cascade), so
// the note count in this dialog is the last thing standing between a mis-click
// and losing a section's worth of writing.
describe("DeleteSectionButton warning", () => {
  it("warns about the notes that would go with it", async () => {
    render(<DeleteSectionButton section={{ ...section, noteCount: 3 }} />);

    const dialog = await open();
    expect(within(dialog).getByText("sectionList.deleteCascade")).toBeTruthy();
  });

  it("uses the softer copy for a section with no notes", async () => {
    render(<DeleteSectionButton section={{ ...section, noteCount: 0 }} />);

    const dialog = await open();
    expect(within(dialog).getByText("sectionList.deleteEmpty")).toBeTruthy();
    expect(within(dialog).queryByText("sectionList.deleteCascade")).toBeNull();
  });

  it("closes without deleting when cancelled", async () => {
    render(<DeleteSectionButton section={section} />);

    const dialog = await open();
    fireEvent.click(within(dialog).getByRole("button", { name: "sectionForm.cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(deleteSectionFn).not.toHaveBeenCalled();
  });
});
