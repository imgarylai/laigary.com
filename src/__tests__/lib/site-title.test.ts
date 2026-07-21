import { describe, expect, it } from "vitest";
import { formatPageTitle } from "@/lib/site-title";

describe("formatPageTitle", () => {
  it("should substitute the page title when the template has a placeholder", () => {
    expect(formatPageTitle("%s | Unconstrained", "Two Sum", "Unconstrained")).toBe(
      "Two Sum | Unconstrained",
    );
    expect(formatPageTitle("%s · Blog", "About", "Unconstrained")).toBe("About · Blog");
  });

  it("should fall back to '%s | siteName' when the template is empty", () => {
    expect(formatPageTitle("", "Two Sum", "Unconstrained")).toBe("Two Sum | Unconstrained");
  });

  it("should fall back when the template lacks the placeholder", () => {
    expect(formatPageTitle("no placeholder here", "Two Sum", "Unconstrained")).toBe(
      "Two Sum | Unconstrained",
    );
  });
});
