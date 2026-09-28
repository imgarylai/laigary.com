// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PublicThemeMenu } from "@/features/public-site/ThemeMenu";

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
  currentTheme = "system";
});

describe("PublicThemeMenu", () => {
  it("should label the theme trigger when rendered", () => {
    render(<PublicThemeMenu />);
    expect(screen.getByRole("button", { name: "common.toggleTheme" })).toBeTruthy();
  });

  it("should select the stored mode when the theme menu opens", async () => {
    // Exercises the mode branch where a concrete light/dark theme is used
    // instead of falling back to "system".
    currentTheme = "dark";
    render(<PublicThemeMenu />);
    fireEvent.click(screen.getByRole("button", { name: "common.toggleTheme" }));
    expect(
      (await screen.findByRole("menuitemradio", { name: /themeDark/ })).getAttribute(
        "aria-checked",
      ),
    ).toBe("true");
  });

  it("should offer light, dark and system when opened", async () => {
    render(<PublicThemeMenu />);
    fireEvent.click(screen.getByRole("button", { name: "common.toggleTheme" }));
    await waitFor(() => {
      expect(screen.getByRole("menuitemradio", { name: /themeLight/ })).toBeTruthy();
      expect(screen.getByRole("menuitemradio", { name: /themeDark/ })).toBeTruthy();
      expect(screen.getByRole("menuitemradio", { name: /themeSystem/ })).toBeTruthy();
    });
  });

  it("should set the theme when an option is chosen", async () => {
    render(<PublicThemeMenu />);
    fireEvent.click(screen.getByRole("button", { name: "common.toggleTheme" }));
    const dark = await screen.findByRole("menuitemradio", { name: /themeDark/ });
    fireEvent.click(dark);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
