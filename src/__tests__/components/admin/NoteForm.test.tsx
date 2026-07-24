// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NoteForm } from "@/components/admin/NoteForm";

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
  useRouter: () => ({ invalidate }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
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

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("NoteForm", () => {
  it("shows the section label, not the raw UUID, in the section select trigger", () => {
    render(<NoteForm sections={sections} tags={[]} />);

    const trigger = screen.getByLabelText("noteForm.section");
    // The default-selected section renders its label ("Coding"), never its id.
    expect(trigger.textContent).toContain("Coding");
    expect(trigger.textContent).not.toContain(sections[0].id);
  });

  it("shows the fixed section label when editing an existing note", () => {
    const note = {
      id: "note-1",
      slug: "my-note",
      sectionId: sections[1].id,
      title: "My Note",
      contentMd: "",
      status: "draft" as const,
      pinned: false,
      tagIds: [],
    };
    render(<NoteForm note={note} sections={sections} tags={[]} />);

    const sectionField = screen.getByLabelText("noteForm.section") as HTMLInputElement;
    expect(sectionField.value).toBe("Behavior Question");
    expect(sectionField.value).not.toBe(sections[1].id);
  });
});
