// @vitest-environment jsdom
//
// The terminal 404: echoes the attempted path as a failed `cat`, and offers
// the `$ cd ~` escape hatch back to home.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { TmNotFound } from "@/components/terminal/NotFound";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "en" }),
}));

// Partial mock: layout.tsx needs the real createLink at module scope; only the
// pieces TmNotFound renders (useLocation, Link) are stubbed router-free.
vi.mock(import("@tanstack/react-router"), async (importOriginal) => ({
  ...(await importOriginal()),
  useLocation: (() => ({ pathname: "/posts/does-not-exist" })) as never,
  Link: (({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className}>{children}</a>
  )) as never,
}));

afterEach(cleanup);

describe("TmNotFound", () => {
  it("should echo the attempted path as a shell error when rendered", () => {
    render(<TmNotFound />);
    expect(screen.getByText("$ cat ~/posts/does-not-exist")).toBeTruthy();
    expect(
      screen.getByText(/cat: ~\/posts\/does-not-exist: No such file or directory/),
    ).toBeTruthy();
  });

  it("should link back to home when rendered", () => {
    render(<TmNotFound />);
    const link = screen.getByText("$ cd ~");
    expect(link.tagName).toBe("A");
    expect(screen.getByText("blog.notFound.back")).toBeTruthy();
  });
});
