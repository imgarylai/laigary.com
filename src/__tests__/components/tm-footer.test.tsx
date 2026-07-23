// @vitest-environment jsdom
//
// Footer status bar: renders the resolved social links, drops unset ones,
// always offers rss, and shows the current path as the tmux window name.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TmFooter, type FooterSocial } from "@/features/terminal/TmFooter";

vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: "/posts" } }),
}));

afterEach(cleanup);

const none: FooterSocial = { github: null, twitter: null, linkedin: null, email: null };

describe("TmFooter", () => {
  it("renders configured links plus rss, and skips unset networks", () => {
    render(
      <TmFooter
        siteName="Unconstrained"
        social={{ ...none, github: "https://github.com/imgarylai" }}
      />,
    );
    expect(screen.getByText("unconstrained")).toBeDefined();
    expect(screen.getByText("github").getAttribute("href")).toBe("https://github.com/imgarylai");
    expect(screen.getByText("rss").getAttribute("href")).toBe("/feed.xml");
    expect(screen.queryByText("linkedin")).toBeNull();
    expect(screen.queryByText("x")).toBeNull();
  });

  it("opens profiles in a new tab but not mailto", () => {
    render(
      <TmFooter
        siteName="Unconstrained"
        social={{ ...none, github: "https://github.com/imgarylai", email: "mailto:g@x.com" }}
      />,
    );
    expect(screen.getByText("github").getAttribute("target")).toBe("_blank");
    expect(screen.getByText("mail").getAttribute("target")).toBeNull();
  });

  it("shows the current path as the tmux window name", () => {
    render(<TmFooter siteName="Unconstrained" social={none} />);
    expect(screen.getByText(/0:~\/posts\*/)).toBeDefined();
  });
});
