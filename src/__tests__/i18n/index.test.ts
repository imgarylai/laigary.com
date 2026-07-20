import { describe, it, expect } from "vitest";
import { getTranslation } from "@/i18n";

describe("getTranslation", () => {
  it("resolves a nested dotted key", () => {
    expect(getTranslation("en", "common.back")).toBe("Back");
  });

  it("resolves per locale", () => {
    expect(getTranslation("zh-TW", "common.back")).toBe("返回");
  });

  it("returns the key itself for a missing path", () => {
    expect(getTranslation("en", "nope.does.not.exist")).toBe("nope.does.not.exist");
  });

  it("returns the key when the path resolves to a non-string (object)", () => {
    expect(getTranslation("en", "common")).toBe("common");
  });
});
