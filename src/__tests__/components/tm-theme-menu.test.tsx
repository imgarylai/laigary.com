// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TmThemeMenu } from "@/features/terminal/ThemeMenu";

const setTheme = vi.fn();
let currentTheme = "system";
vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ theme: currentTheme, setTheme }),
}));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "en" }),
}));

// Base UI's menu positioner observes size; jsdom has no ResizeObserver.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

afterEach(() => {
  cleanup();
  setTheme.mockClear();
  currentTheme = "system";
});

describe("TmThemeMenu", () => {
  it("renders a trigger button labelled for toggling the theme", () => {
    render(<TmThemeMenu />);
    expect(screen.getByRole("button", { name: "common.toggleTheme" })).toBeTruthy();
  });

  it("reflects an explicit stored theme in the trigger", () => {
    // Exercises the mode branch where a concrete light/dark theme is used
    // instead of falling back to "system".
    currentTheme = "dark";
    render(<TmThemeMenu />);
    expect(screen.getByRole("button", { name: "common.toggleTheme" }).title).toContain("dark");
  });

  it("opens the menu and offers light / dark / system", async () => {
    render(<TmThemeMenu />);
    fireEvent.click(screen.getByRole("button", { name: "common.toggleTheme" }));
    await waitFor(() => {
      expect(screen.getByRole("menuitemradio", { name: /themeLight/ })).toBeTruthy();
      expect(screen.getByRole("menuitemradio", { name: /themeDark/ })).toBeTruthy();
      expect(screen.getByRole("menuitemradio", { name: /themeSystem/ })).toBeTruthy();
    });
  });

  it("sets the theme when an option is chosen", async () => {
    render(<TmThemeMenu />);
    fireEvent.click(screen.getByRole("button", { name: "common.toggleTheme" }));
    const dark = await screen.findByRole("menuitemradio", { name: /themeDark/ });
    fireEvent.click(dark);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
