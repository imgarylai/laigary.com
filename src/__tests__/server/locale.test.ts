import { describe, it, expect, vi } from "vitest";
import { pickLocale, resolveLocaleImpl } from "@/server/locale";

const { getCookie, getRequestHeader } = vi.hoisted(() => ({
  getCookie: vi.fn<(name: string) => string | undefined>(),
  getRequestHeader: vi.fn<(name: string) => string | undefined>(),
}));
vi.mock("@tanstack/react-start/server", () => ({ getCookie, getRequestHeader }));

describe("pickLocale", () => {
  it("prefers a valid cookie over everything", () => {
    expect(pickLocale("zh-TW", "en-US,en")).toBe("zh-TW");
    expect(pickLocale("en", "zh-TW,zh")).toBe("en");
  });

  it("ignores an invalid cookie and falls back to Accept-Language", () => {
    expect(pickLocale("fr", "zh-TW,zh;q=0.9")).toBe("zh-TW");
    expect(pickLocale(undefined, "zh-Hant,zh;q=0.9,en;q=0.8")).toBe("zh-TW");
  });

  it("falls back to the default (en) when nothing matches zh", () => {
    expect(pickLocale(undefined, "en-US,en;q=0.9")).toBe("en");
    expect(pickLocale(undefined, undefined)).toBe("en");
    expect(pickLocale(undefined, "")).toBe("en");
  });
});

// `pickLocale` proves the precedence; this proves the loader hands it the right
// two request values. A misspelt cookie key or header name reads as "nothing
// set" and silently pins every visitor to the default locale — no error, no
// failing assertion anywhere else.
describe("resolveLocaleImpl", () => {
  it("reads the locale cookie and the Accept-Language header by name", async () => {
    getCookie.mockReturnValue(undefined);
    getRequestHeader.mockReturnValue("zh-TW,zh;q=0.9");

    expect(await resolveLocaleImpl()).toBe("zh-TW");
    expect(getCookie).toHaveBeenCalledWith("locale");
    expect(getRequestHeader).toHaveBeenCalledWith("accept-language");
  });

  it("lets the cookie win over the header", async () => {
    getCookie.mockReturnValue("en");
    getRequestHeader.mockReturnValue("zh-TW,zh;q=0.9");

    expect(await resolveLocaleImpl()).toBe("en");
  });

  it("falls back to the default when the request carries neither", async () => {
    getCookie.mockReturnValue(undefined);
    getRequestHeader.mockReturnValue(undefined);

    expect(await resolveLocaleImpl()).toBe("en");
  });
});
