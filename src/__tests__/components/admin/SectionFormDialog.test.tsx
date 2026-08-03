// @vitest-environment jsdom
//
// The section dialog. Same shape as TagFormDialog, and the same two invariants
// worth pinning: the slug is part of the public /interview/$section URL so edit
// mode must never send it, and sortOrder must reach the server as a number —
// `valueAsNumber` is the only thing stopping an <input type="number"> handing
// over the string "3", which the zod `z.number().int()` would then reject.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { SectionFormDialog } from "@/components/admin/SectionFormDialog";

const { createSectionFn, updateSectionFn, invalidate } = vi.hoisted(() => ({
  createSectionFn: vi.fn(),
  updateSectionFn: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ invalidate }) }));
vi.mock("@/server/admin/interview", () => ({ createSectionFn, updateSectionFn }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

const existing = {
  id: "s1",
  slug: "leetcode",
  label: "LeetCode",
  blurb: "practice",
  icon: "[#]",
  sortOrder: 2,
};

const slugInput = () => screen.getByLabelText("sectionForm.slug") as HTMLInputElement;
const labelInput = () => screen.getByLabelText("sectionForm.label") as HTMLInputElement;
const sortInput = () => screen.getByLabelText("sectionForm.sortOrder") as HTMLInputElement;

function openDialog(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

beforeEach(() => {
  createSectionFn.mockResolvedValue({ ok: true });
  updateSectionFn.mockResolvedValue({ ok: true });
});
afterEach(cleanup);

describe("SectionFormDialog in create mode", () => {
  it("derives the slug from the label as it is typed", async () => {
    render(<SectionFormDialog />);
    openDialog("sectionList.newSection");

    fireEvent.change(labelInput(), { target: { value: "System Design" } });

    await waitFor(() => expect(slugInput().value).toBe("system-design"));
  });

  it("derives the slug again for the next section the reopened dialog creates", async () => {
    // One dialog instance serves every new section, so the autofill's memory of
    // the slug it last wrote has to be cleared along with the field values —
    // otherwise the second section's label would find a stale slug in the field
    // and hand the whole thing over as if it had been typed by hand.
    render(<SectionFormDialog />);
    openDialog("sectionList.newSection");
    fireEvent.change(labelInput(), { target: { value: "System Design" } });
    fireEvent.click(screen.getByRole("button", { name: "sectionForm.create" }));
    await waitFor(() => expect(createSectionFn).toHaveBeenCalled());

    openDialog("sectionList.newSection");
    fireEvent.change(labelInput(), { target: { value: "Behavioural" } });

    await waitFor(() => expect(slugInput().value).toBe("behavioural"));
  });

  it("sends sortOrder as a number, not the input's string", async () => {
    render(<SectionFormDialog />);
    openDialog("sectionList.newSection");

    fireEvent.change(labelInput(), { target: { value: "Arrays" } });
    fireEvent.change(sortInput(), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "sectionForm.create" }));

    await waitFor(() => expect(createSectionFn).toHaveBeenCalled());
    const sent = createSectionFn.mock.lastCall?.[0].data;
    expect(sent.sortOrder).toBe(3);
    expect(typeof sent.sortOrder).toBe("number");
  });
});

describe("SectionFormDialog in edit mode", () => {
  it("leaves the slug alone when the label is retyped", async () => {
    render(<SectionFormDialog section={existing} />);
    openDialog("sectionList.edit");

    fireEvent.change(labelInput(), { target: { value: "LC v2" } });

    await waitFor(() => expect(labelInput().value).toBe("LC v2"));
    expect(slugInput().value).toBe("leetcode");
  });

  it("shows the slug as read-only", () => {
    render(<SectionFormDialog section={existing} />);
    openDialog("sectionList.edit");

    expect(slugInput().readOnly).toBe(true);
  });

  it("submits every editable field and the id — never a slug", async () => {
    render(<SectionFormDialog section={existing} />);
    openDialog("sectionList.edit");

    fireEvent.change(labelInput(), { target: { value: "LC v2" } });
    fireEvent.click(screen.getByRole("button", { name: "sectionForm.update" }));

    await waitFor(() => expect(updateSectionFn).toHaveBeenCalled());
    const sent = updateSectionFn.mock.lastCall?.[0].data;
    expect(sent).toEqual({
      id: "s1",
      label: "LC v2",
      blurb: "practice",
      icon: "[#]",
      sortOrder: 2,
    });
    expect(sent).not.toHaveProperty("slug");
  });

  it("reports the server's reason and does not invalidate on failure", async () => {
    updateSectionFn.mockResolvedValue({ ok: false, error: "Section slug already exists" });
    const { toast } = await import("sonner");
    render(<SectionFormDialog section={existing} />);
    openDialog("sectionList.edit");

    fireEvent.click(screen.getByRole("button", { name: "sectionForm.update" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Section slug already exists"));
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe("SectionFormDialog cancel", () => {
  it("discards the typing when the dialog is dismissed rather than cancelled", async () => {
    // The cancel button calls setOpen(false) directly; Escape and an
    // outside click come back through onOpenChange, which is the only path
    // that has to reset the form itself.
    render(<SectionFormDialog />);
    openDialog("sectionList.newSection");
    fireEvent.change(labelInput(), { target: { value: "Dismissed" } });

    fireEvent.keyDown(document.body, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    openDialog("sectionList.newSection");
    expect(labelInput().value).toBe("");
    expect(slugInput().value).toBe("");
    expect(createSectionFn).not.toHaveBeenCalled();
  });

  it("closes without submitting and discards the typing", async () => {
    render(<SectionFormDialog />);
    openDialog("sectionList.newSection");
    fireEvent.change(labelInput(), { target: { value: "Discarded" } });

    fireEvent.click(screen.getByRole("button", { name: "sectionForm.cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(createSectionFn).not.toHaveBeenCalled();
  });
});
