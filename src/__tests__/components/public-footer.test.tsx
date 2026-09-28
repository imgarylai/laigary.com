// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PublicFooter, type FooterSocial } from "@/features/public-site/Footer";
import { I18nProvider } from "@/i18n/I18nProvider";
afterEach(cleanup);
const none: FooterSocial = { github: null, twitter: null, linkedin: null, email: null };
function footer(social: FooterSocial) {
  render(
    <I18nProvider initialLocale="en">
      <PublicFooter social={social} />
    </I18nProvider>,
  );
}
describe("public footer", () => {
  it("should show the personal identity and configured links when rendered", () => {
    footer({ ...none, github: "https://github.com/imgarylai" });
    expect(screen.getByText(/© .* Gary Lai/)).toBeTruthy();
    expect(screen.getByText("laigary.com")).toBeTruthy();
    expect(screen.getByRole("link", { name: "GitHub" }).getAttribute("href")).toBe(
      "https://github.com/imgarylai",
    );
    expect(screen.queryByRole("link", { name: "LinkedIn" })).toBeNull();
    expect(screen.getByRole("link", { name: "RSS" }).getAttribute("href")).toBe("/feed.xml");
  });
  it("should open profiles externally and email directly when configured", () => {
    footer({ ...none, github: "https://github.com/imgarylai", email: "mailto:g@example.com" });
    expect(screen.getByRole("link", { name: "GitHub" }).getAttribute("target")).toBe("_blank");
    expect(screen.getByRole("link", { name: "Email" }).getAttribute("target")).toBeNull();
  });
});
