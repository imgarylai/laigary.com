// @vitest-environment jsdom
//
// The guard between an editor full of unsaved work and a stray click on the
// sidebar (#177). There is no autosave, so if this does not fire the work is
// simply gone.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { UnsavedChangesGuard } from "@/components/admin/UnsavedChangesGuard";

const { useBlocker } = vi.hoisted(() => ({ useBlocker: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ useBlocker }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

const idle = { status: "idle" as const };

function blocked() {
  const proceed = vi.fn();
  const reset = vi.fn();
  useBlocker.mockReturnValue({ status: "blocked", proceed, reset });
  return { proceed, reset };
}

/** The options the component handed to useBlocker on its last render. */
function opts() {
  return useBlocker.mock.lastCall?.[0] as {
    shouldBlockFn: () => boolean;
    enableBeforeUnload: () => boolean;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useBlocker.mockReturnValue(idle);
});
afterEach(cleanup);

describe("UnsavedChangesGuard", () => {
  it("should block navigation while there are unsaved changes", () => {
    render(<UnsavedChangesGuard dirty saving={false} />);

    expect(opts().shouldBlockFn()).toBe(true);
  });

  it("should let a clean form navigate freely", () => {
    render(<UnsavedChangesGuard dirty={false} saving={false} />);

    expect(opts().shouldBlockFn()).toBe(false);
  });

  it("should not block the redirect a save itself performs", () => {
    // Creating a post navigates to the edit route as the last step of saving,
    // while the form is still dirty. Blocking that would trap the author in a
    // dialog asking whether to discard changes they just saved.
    render(<UnsavedChangesGuard dirty saving />);

    expect(opts().shouldBlockFn()).toBe(false);
  });

  it("should warn on tab close under exactly the same condition", () => {
    // A page cannot render its own dialog during unload, so this is the
    // browser's; it must agree with the in-app guard or the two disagree about
    // whether the work is safe.
    render(<UnsavedChangesGuard dirty saving={false} />);
    expect(opts().enableBeforeUnload()).toBe(true);

    cleanup();
    render(<UnsavedChangesGuard dirty={false} saving={false} />);
    expect(opts().enableBeforeUnload()).toBe(false);
  });

  it("should show nothing while nothing is blocked", () => {
    render(<UnsavedChangesGuard dirty saving={false} />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should ask before discarding once a navigation is blocked", async () => {
    blocked();

    render(<UnsavedChangesGuard dirty saving={false} />);

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("postForm.leaveTitle")).toBeTruthy();
  });

  it("should stay put when the author chooses to keep editing", async () => {
    const { proceed, reset } = blocked();
    render(<UnsavedChangesGuard dirty saving={false} />);
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "postForm.keepEditing" }));

    expect(reset).toHaveBeenCalled();
    expect(proceed).not.toHaveBeenCalled();
  });

  it("should navigate away when the author discards the changes", async () => {
    const { proceed, reset } = blocked();
    render(<UnsavedChangesGuard dirty saving={false} />);
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "postForm.discardChanges" }));

    expect(proceed).toHaveBeenCalled();
    expect(reset).not.toHaveBeenCalled();
  });

  it("should treat dismissing the dialog as staying put", async () => {
    // Escape or a backdrop click means "I did not mean to leave", not "discard".
    const { proceed, reset } = blocked();
    render(<UnsavedChangesGuard dirty saving={false} />);
    await screen.findByRole("dialog");

    fireEvent.keyDown(document.body, { key: "Escape" });

    await waitFor(() => expect(reset).toHaveBeenCalled());
    expect(proceed).not.toHaveBeenCalled();
  });
});
