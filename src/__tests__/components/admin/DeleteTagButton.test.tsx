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

async function open() {
  fireEvent.click(screen.getByRole("button", { name: "tagList.delete" }));
  return screen.findByRole("dialog");
}

async function openAndConfirm() {
  const dialog = await open();
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

// Deleting a tag drops its junction rows, so the dialog's job before the
// confirm button is to say what is about to lose the tag. That list was
// rendering untested — a tag in use looking unused is how one gets deleted.
describe("DeleteTagButton warning", () => {
  it("names what still uses the tag", async () => {
    render(
      <DeleteTagButton
        tag={{
          ...tag,
          postCount: 1,
          noteCount: 1,
          usedBy: [
            { type: "post", title: "Hello World", slug: "hello" },
            { type: "note", title: "Two Sum", slug: "two-sum" },
          ],
        }}
      />,
    );

    const dialog = await open();
    expect(within(dialog).getByText("admin.deleteTagInUse")).toBeTruthy();
    // Both kinds of user are listed; counting posts alone would drop the note.
    expect(within(dialog).getByText(/Hello World/)).toBeTruthy();
    expect(within(dialog).getByText(/Two Sum/)).toBeTruthy();
  });

  it("says the tag is unused when nothing references it", async () => {
    render(<DeleteTagButton tag={{ ...tag, postCount: 0, noteCount: 0, usedBy: [] }} />);

    const dialog = await open();
    expect(within(dialog).getByText("admin.deleteTagUnused")).toBeTruthy();
    expect(within(dialog).queryByRole("list")).toBeNull();
  });

  it("closes without deleting when cancelled", async () => {
    render(<DeleteTagButton tag={tag} />);

    const dialog = await open();
    fireEvent.click(within(dialog).getByRole("button", { name: "tagForm.cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(deleteTagFn).not.toHaveBeenCalled();
  });
});
