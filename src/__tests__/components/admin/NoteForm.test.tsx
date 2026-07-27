// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { NoteForm } from "@/components/admin/NoteForm";

// Base UI's Select positioner observes size; jsdom has no ResizeObserver, and
// without it the popup never opens.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

const { createNoteFn, updateNoteFn, navigate, invalidate, toast } = vi.hoisted(() => ({
  createNoteFn: vi.fn(),
  updateNoteFn: vi.fn(),
  navigate: vi.fn(),
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/server/admin/interview", () => ({ createNoteFn, updateNoteFn }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  // The editor's navigation guard calls this; an idle resolver means nothing is
  // currently blocked, which is the state every test here starts in.
  useBlocker: () => ({ status: "idle" }),
  useRouter: () => ({ invalidate }),
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ t: (k: string) => k, locale: "en" }) }));
// Stub the heavy lazy editor with a plain textarea.
vi.mock("@/components/admin/TiptapEditor", () => ({
  TiptapEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea data-testid="editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const sections = [
  { id: "65227d15-246d-4038-aca0-5a256456cc62", label: "Coding", slug: "coding" },
  { id: "11111111-1111-1111-1111-111111111111", label: "Behavior Question", slug: "behavior" },
];

const tags = [
  { id: "tag-1", name: "React", slug: "react" },
  { id: "tag-2", name: "TypeScript", slug: "typescript" },
];

const existingNote = {
  id: "note-1",
  slug: "my-note",
  sectionId: sections[1].id,
  title: "My Note",
  contentMd: "hello",
  status: "published" as const,
  pinned: false,
  tagIds: ["tag-1"],
};

// Slug, section, status, pinned and tags now live in the settings sheet (#174),
// so anything touching them has to open it first — the writing surface is only
// the title and the editor.
function openSettings() {
  fireEvent.click(screen.getByRole("button", { name: "noteForm.settings" }));
}

// The sheet is modal, so the action bar behind it is inert while it is open —
// close it before reaching for Save.
function closeSettings() {
  fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
}

// Base UI's Select renders its listbox in a portal only once opened. Open the
// trigger, then click the option with the given text.
function selectOption(trigger: HTMLElement, optionText: string) {
  fireEvent.click(trigger);
  const option = screen.getByRole("option", { name: optionText });
  fireEvent.pointerDown(option);
  fireEvent.pointerUp(option);
  fireEvent.click(option);
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("NoteForm", () => {
  it("shows the section label, not the raw UUID, in the section select trigger", () => {
    render(<NoteForm sections={sections} tags={tags} />);

    openSettings();
    const trigger = screen.getByLabelText("noteForm.section");
    // The default-selected section renders its label ("Coding"), never its id.
    expect(trigger.textContent).toContain("Coding");
    expect(trigger.textContent).not.toContain(sections[0].id);
  });

  it("creates a note (auto-slug from title) and navigates to its editor", async () => {
    createNoteFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<NoteForm sections={sections} tags={tags} />);

    fireEvent.change(screen.getByLabelText("noteForm.title"), { target: { value: "My New Note" } });
    fireEvent.click(screen.getByRole("button", { name: "noteForm.create" }));

    await waitFor(() => expect(createNoteFn).toHaveBeenCalledTimes(1));
    const arg = createNoteFn.mock.calls[0][0].data;
    expect(arg.title).toBe("My New Note");
    expect(arg.slug).toBe("my-new-note");
    expect(arg.sectionId).toBe(sections[0].id);
    expect(toast.success).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith({
      to: "/admin/interview/notes/$noteId/edit",
      params: { noteId: "new-id" },
    });
  });

  it("shows an error toast when create fails and does not navigate", async () => {
    createNoteFn.mockResolvedValue({ ok: false, error: "boom" });
    render(<NoteForm sections={sections} tags={tags} />);

    fireEvent.change(screen.getByLabelText("noteForm.title"), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: "noteForm.create" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("boom"));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("submits the chosen section when a different one is selected", async () => {
    createNoteFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<NoteForm sections={sections} tags={tags} />);

    fireEvent.change(screen.getByLabelText("noteForm.title"), { target: { value: "Note" } });
    openSettings();
    selectOption(screen.getByLabelText("noteForm.section"), "Behavior Question");
    closeSettings();
    fireEvent.click(screen.getByRole("button", { name: "noteForm.create" }));

    await waitFor(() => expect(createNoteFn).toHaveBeenCalledTimes(1));
    expect(createNoteFn.mock.calls[0][0].data.sectionId).toBe(sections[1].id);
  });

  it("toggles the published and pinned switches before submitting", async () => {
    createNoteFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<NoteForm sections={sections} tags={tags} />);

    fireEvent.change(screen.getByLabelText("noteForm.title"), { target: { value: "Note" } });
    openSettings();
    // Status is a switch now, not a two-option select, so both toggles are
    // switches and have to be told apart by label.
    // Base UI renders a role="switch" span plus a hidden input, both tied to
    // the label, so query by role to get the one that takes the click.
    fireEvent.click(screen.getByRole("switch", { name: "postForm.published" }));
    fireEvent.click(screen.getByRole("switch", { name: "noteForm.pinned" }));
    closeSettings();
    fireEvent.click(screen.getByRole("button", { name: "noteForm.create" }));

    await waitFor(() => expect(createNoteFn).toHaveBeenCalledTimes(1));
    const arg = createNoteFn.mock.calls[0][0].data;
    expect(arg.pinned).toBe(true);
    expect(arg.status).toBe("published");
  });

  it("edits an existing note: fixed section label, preview link, and update call", async () => {
    updateNoteFn.mockResolvedValue({ ok: true });
    render(<NoteForm note={existingNote} sections={sections} tags={tags} />);

    // Section is fixed (read-only) and shows the label, not the UUID.
    openSettings();
    const sectionField = screen.getByLabelText("noteForm.section") as HTMLInputElement;
    expect(sectionField.value).toBe("Behavior Question");
    expect(sectionField.value).not.toBe(sections[1].id);

    // Published note with a slug exposes a preview link to its public page.
    expect(screen.getByText("noteForm.preview")).toBeTruthy();

    closeSettings();
    fireEvent.click(screen.getByRole("button", { name: "noteForm.update" }));
    await waitFor(() => expect(updateNoteFn).toHaveBeenCalledTimes(1));
    expect(updateNoteFn.mock.calls[0][0].data.id).toBe("note-1");
    expect(toast.success).toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalled();
  });

  it("saves via the Cmd/Ctrl+S shortcut", async () => {
    createNoteFn.mockResolvedValue({ ok: true, data: { id: "new-id" } });
    render(<NoteForm sections={sections} tags={tags} />);

    fireEvent.change(screen.getByLabelText("noteForm.title"), { target: { value: "Note" } });
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });

    await waitFor(() => expect(createNoteFn).toHaveBeenCalledTimes(1));
  });

  it("shows an error toast when update fails", async () => {
    updateNoteFn.mockResolvedValue({ ok: false, error: "nope" });
    render(<NoteForm note={existingNote} sections={sections} tags={tags} />);

    fireEvent.click(screen.getByRole("button", { name: "noteForm.update" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("nope"));
  });

  it("navigates back to the list when Cancel is clicked", () => {
    render(<NoteForm sections={sections} tags={tags} />);
    fireEvent.click(screen.getByRole("button", { name: "noteForm.cancel" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/admin/interview/notes" });
  });

  it("does not auto-fill the slug when editing an existing note's title", () => {
    render(<NoteForm note={existingNote} sections={sections} tags={tags} />);
    openSettings();
    const slug = screen.getByLabelText("noteForm.slug") as HTMLInputElement;
    expect(slug.value).toBe("my-note");
    // In edit mode the slug is left alone as the title changes.
    fireEvent.change(screen.getByLabelText("noteForm.title"), { target: { value: "Renamed" } });
    expect(slug.value).toBe("my-note");
  });

  it("renders with an empty sectionId when there are no sections", () => {
    render(<NoteForm sections={[]} tags={tags} />);
    openSettings();
    expect(screen.getByLabelText("noteForm.section")).toBeTruthy();
  });

  it("hides the preview link for a draft note", () => {
    render(
      <NoteForm note={{ ...existingNote, status: "draft" }} sections={sections} tags={tags} />,
    );
    expect(screen.queryByText("noteForm.preview")).toBeNull();
  });
});
