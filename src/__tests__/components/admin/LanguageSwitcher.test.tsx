// @vitest-environment jsdom
//
// Five lines, one of which decides whether the switcher switches. With no test,
// `onClick={() => setLocale(key)}` could have been hardcoded to one locale and
// the menu would still have looked right.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LanguageSwitcher } from "@/components/admin/LanguageSwitcher";

const { setLocale, locale } = vi.hoisted(() => ({ setLocale: vi.fn(), locale: { value: "en" } }));

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: locale.value, setLocale }),
}));

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

const open = () => fireEvent.click(screen.getByRole("button", { name: "Switch language" }));

beforeEach(() => {
  locale.value = "en";
});
afterEach(cleanup);

describe("LanguageSwitcher", () => {
  it("switches to the locale that was picked, not a fixed one", async () => {
    render(<LanguageSwitcher />);
    open();

    fireEvent.click(await screen.findByRole("menuitem", { name: "繁體中文" }));

    await waitFor(() => expect(setLocale).toHaveBeenCalledWith("zh-TW"));
  });

  it("switches back to English from a zh-TW session", async () => {
    // Both directions, so a hardcoded locale cannot pass by matching the
    // default. Picking English while already on English would prove nothing.
    locale.value = "zh-TW";
    render(<LanguageSwitcher />);
    open();

    fireEvent.click(await screen.findByRole("menuitem", { name: "English" }));

    await waitFor(() => expect(setLocale).toHaveBeenCalledWith("en"));
  });

  it("marks the active locale in bold and leaves the other plain", async () => {
    locale.value = "zh-TW";
    render(<LanguageSwitcher />);
    open();

    const zh = await screen.findByRole("menuitem", { name: "繁體中文" });
    expect(zh.className).toContain("font-bold");
    expect(screen.getByRole("menuitem", { name: "English" }).className).not.toContain("font-bold");
  });

  it("lists every supported locale by its own name", async () => {
    render(<LanguageSwitcher />);
    open();

    await screen.findByRole("menuitem", { name: "English" });
    expect(screen.getAllByRole("menuitem").map((el) => el.textContent)).toEqual([
      "English",
      "繁體中文",
    ]);
  });
});
