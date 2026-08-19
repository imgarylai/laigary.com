// @vitest-environment happy-dom
//
// The shadcn ThemeMenu used by the admin header. Separate implementation from
// the terminal one in features/terminal (Base UI menu, covered by
// tm-theme-menu.test.tsx) — sharing a name is not sharing code, so it needs its
// own proof rather than inheriting that file's.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ThemeMenu } from "@/components/ThemeMenu";

const { setTheme, theme } = vi.hoisted(() => ({ setTheme: vi.fn(), theme: { value: "system" } }));

vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ theme: theme.value, setTheme }),
}));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "en" }),
}));

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

const trigger = () => screen.getByRole("button", { name: "common.toggleTheme" });

beforeEach(() => {
  theme.value = "system";
});
afterEach(cleanup);

describe("ThemeMenu", () => {
  it("reports the stored theme on the trigger once mounted", async () => {
    theme.value = "dark";
    render(<ThemeMenu />);

    // The title carries the resolved mode, which is the only externally visible
    // signal of which icon the trigger chose.
    await waitFor(() => expect(trigger().title).toBe("common.toggleTheme: dark"));
  });

  it("stays on system for a theme value it does not recognise", async () => {
    theme.value = "solarized";
    render(<ThemeMenu />);

    await waitFor(() => expect(trigger().title).toBe("common.toggleTheme: system"));
  });

  it("renders the neutral system icon on the server even with a theme stored", () => {
    // The `mounted` gate exists for hydration: the stored theme is only known on
    // the client, so the SSR pass must not commit to it or React reports a
    // mismatch. RTL cannot see this — it flushes useEffect immediately, leaving
    // `mounted` true before any assertion runs — so this asserts the server
    // render directly, which is the only place the gate is observable.
    theme.value = "dark";

    const html = renderToString(<ThemeMenu />);

    expect(html).toContain("common.toggleTheme: system");
    expect(html).not.toContain("common.toggleTheme: dark");
  });

  it("offers all three modes and sets the one picked", async () => {
    render(<ThemeMenu />);
    fireEvent.click(trigger());

    const light = await screen.findByRole("menuitemradio", { name: "common.themeLight" });
    expect(screen.getByRole("menuitemradio", { name: "common.themeDark" })).toBeTruthy();
    expect(screen.getByRole("menuitemradio", { name: "common.themeSystem" })).toBeTruthy();

    fireEvent.click(light);

    await waitFor(() => expect(setTheme).toHaveBeenCalledWith("light"));
  });

  it("marks the current mode as the checked radio item", async () => {
    theme.value = "dark";
    render(<ThemeMenu />);
    fireEvent.click(trigger());

    const dark = await screen.findByRole("menuitemradio", { name: "common.themeDark" });
    expect(dark.getAttribute("aria-checked")).toBe("true");
    expect(
      screen.getByRole("menuitemradio", { name: "common.themeLight" }).getAttribute("aria-checked"),
    ).toBe("false");
  });
});
