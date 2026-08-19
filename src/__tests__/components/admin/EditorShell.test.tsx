// @vitest-environment happy-dom
//
// The editor frame (#174): what the action bar exposes, where the settings
// fields live, and how the preview gets toggled.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { EditorShell } from "@/components/admin/EditorShell";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

function renderShell() {
  const body = vi.fn(({ showPreview }: { showPreview: boolean }) => (
    <p>{showPreview ? "preview on" : "preview off"}</p>
  ));
  render(
    <EditorShell
      heading="Edit post"
      settingsLabel="postForm.settings"
      settings={<label htmlFor="slug">a settings field</label>}
      actions={<button type="button">Save</button>}
    >
      {body}
    </EditorShell>,
  );
  return { body };
}

describe("EditorShell", () => {
  it("should show what is being edited and the form's own actions in the bar", () => {
    renderShell();

    expect(screen.getByText("Edit post")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("should keep settings fields out of the writing surface until asked for", () => {
    // The whole point: the article starts at the top of the page instead of
    // below a stack of metadata fields.
    renderShell();

    expect(screen.queryByText("a settings field")).toBeNull();
  });

  it("should reveal the settings fields when the sheet is opened", () => {
    renderShell();

    fireEvent.click(screen.getByRole("button", { name: "postForm.settings" }));

    expect(screen.getByText("a settings field")).toBeTruthy();
  });

  it("should start with the preview closed so writing gets the full measure", () => {
    const { body } = renderShell();

    expect(screen.getByText("preview off")).toBeTruthy();
    expect(body).toHaveBeenCalledWith({ showPreview: false });
  });

  it("should hand the preview state to the writing surface when toggled from the bar", () => {
    renderShell();

    fireEvent.click(screen.getByRole("button", { name: /postForm.showPreview/ }));

    expect(screen.getByText("preview on")).toBeTruthy();
  });

  it("should toggle the preview from the keyboard anywhere on the page", () => {
    renderShell();

    fireEvent.keyDown(window, { key: "P", ctrlKey: true, shiftKey: true });
    expect(screen.getByText("preview on")).toBeTruthy();

    fireEvent.keyDown(window, { key: "P", ctrlKey: true, shiftKey: true });
    expect(screen.getByText("preview off")).toBeTruthy();
  });

  it("should ignore the shortcut without the modifiers so typing a P still types", () => {
    renderShell();

    fireEvent.keyDown(window, { key: "P" });
    fireEvent.keyDown(window, { key: "P", ctrlKey: true });

    expect(screen.getByText("preview off")).toBeTruthy();
  });
});
