// @vitest-environment jsdom
//
// The only thing on the editor page that distinguishes a saved draft from an
// unsaved one (#177). There is no autosave, so getting this wrong is how work
// gets lost.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SaveState } from "@/components/admin/SaveState";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

afterEach(cleanup);

describe("SaveState", () => {
  it("should say the work is unsaved once the form is dirty", () => {
    render(<SaveState dirty saving={false} saved />);

    expect(screen.getByText("postForm.unsavedChanges")).toBeTruthy();
  });

  it("should say it is saving while the request is in flight", () => {
    // Saving wins over dirty: the form is still dirty until the reset lands,
    // and "Unsaved changes" during a save would read as a failure.
    render(<SaveState dirty saving saved />);

    expect(screen.getByText("postForm.saving")).toBeTruthy();
    expect(screen.queryByText("postForm.unsavedChanges")).toBeNull();
  });

  it("should confirm everything is stored once clean", () => {
    render(<SaveState dirty={false} saving={false} saved />);

    expect(screen.getByText("postForm.allSaved")).toBeTruthy();
  });

  it("should stay silent on a record that has never been saved", () => {
    // A new post has nothing stored, so "Saved" would be a lie.
    render(<SaveState dirty={false} saving={false} saved={false} />);

    expect(screen.queryByText("postForm.allSaved")).toBeNull();
    expect(screen.queryByText("postForm.unsavedChanges")).toBeNull();
  });

  it("should still announce a new record's first unsaved edit", () => {
    render(<SaveState dirty saving={false} saved={false} />);

    expect(screen.getByText("postForm.unsavedChanges")).toBeTruthy();
  });

  it("should announce changes politely, since nobody is focused on it", () => {
    const { container } = render(<SaveState dirty saving={false} saved />);

    expect(container.firstElementChild?.getAttribute("aria-live")).toBe("polite");
  });
});
