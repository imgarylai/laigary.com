// @vitest-environment jsdom
//
// The tag dialog, both modes. The invariant worth the most here is that editing
// a tag cannot change its slug: the slug is part of the public /tags/$slug URL,
// so rewriting it on a rename silently breaks every existing link — the same
// class of damage as #201, just arriving through the UI instead of the DB.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { TagFormDialog } from "@/components/admin/TagFormDialog";

const { createTagFn, updateTagFn, invalidate } = vi.hoisted(() => ({
  createTagFn: vi.fn(),
  updateTagFn: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ invalidate }) }));
vi.mock("@/server/admin/tags", () => ({ createTagFn, updateTagFn }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

const existing = { id: "t1", name: "Go", slug: "go" };

function openDialog(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

const nameInput = () => screen.getByLabelText("tagForm.name") as HTMLInputElement;
const slugInput = () => screen.getByLabelText("tagForm.slug") as HTMLInputElement;

beforeEach(() => {
  createTagFn.mockResolvedValue({ ok: true });
  updateTagFn.mockResolvedValue({ ok: true });
});
afterEach(cleanup);

describe("TagFormDialog in create mode", () => {
  it("derives the slug from the name as it is typed", async () => {
    render(<TagFormDialog />);
    openDialog("tagList.newTag");

    fireEvent.change(nameInput(), { target: { value: "Systems Design" } });

    await waitFor(() => expect(slugInput().value).toBe("systems-design"));
  });

  it("stops deriving once the slug has been edited by hand", async () => {
    render(<TagFormDialog />);
    openDialog("tagList.newTag");

    fireEvent.change(nameInput(), { target: { value: "Go" } });
    await waitFor(() => expect(slugInput().value).toBe("go"));
    fireEvent.change(slugInput(), { target: { value: "golang" } });
    fireEvent.change(nameInput(), { target: { value: "Go Lang" } });

    // The hand-typed slug survives a later name change.
    await waitFor(() => expect(nameInput().value).toBe("Go Lang"));
    expect(slugInput().value).toBe("golang");
  });

  it("sends both name and slug", async () => {
    render(<TagFormDialog />);
    openDialog("tagList.newTag");

    fireEvent.change(nameInput(), { target: { value: "Rust" } });
    fireEvent.click(screen.getByRole("button", { name: "tagForm.create" }));

    await waitFor(() =>
      expect(createTagFn).toHaveBeenCalledWith({ data: { name: "Rust", slug: "rust" } }),
    );
  });
});

describe("TagFormDialog in edit mode", () => {
  it("leaves the slug alone when the name is retyped", async () => {
    // The gate is `!isEdit` on the name field's onChange. Without it a rename
    // rewrites the slug in the form, and the read-only attribute below is no
    // protection at all — it only stops the user typing there.
    render(<TagFormDialog tag={existing} />);
    openDialog("tagList.edit");

    fireEvent.change(nameInput(), { target: { value: "Golang" } });

    await waitFor(() => expect(nameInput().value).toBe("Golang"));
    expect(slugInput().value).toBe("go");
  });

  it("shows the slug as read-only", () => {
    render(<TagFormDialog tag={existing} />);
    openDialog("tagList.edit");

    expect(slugInput().readOnly).toBe(true);
    expect(slugInput().disabled).toBe(true);
  });

  it("submits the name and the id only — never a slug", async () => {
    render(<TagFormDialog tag={existing} />);
    openDialog("tagList.edit");

    fireEvent.change(nameInput(), { target: { value: "Golang" } });
    fireEvent.click(screen.getByRole("button", { name: "tagForm.update" }));

    await waitFor(() =>
      expect(updateTagFn).toHaveBeenCalledWith({ data: { id: "t1", name: "Golang" } }),
    );
    expect(updateTagFn.mock.lastCall?.[0].data).not.toHaveProperty("slug");
  });

  it("reports the server's reason and stays open when the rename is refused", async () => {
    updateTagFn.mockResolvedValue({ ok: false, error: "Tag name already exists" });
    const { toast } = await import("sonner");
    render(<TagFormDialog tag={existing} />);
    openDialog("tagList.edit");

    fireEvent.click(screen.getByRole("button", { name: "tagForm.update" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Tag name already exists"));
    expect(invalidate).not.toHaveBeenCalled();
    expect(nameInput()).toBeTruthy();
  });
});
