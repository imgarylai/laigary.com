// @vitest-environment happy-dom
//
// Missing public content uses an ordinary explanation and home link.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { TmNotFound } from "@/features/terminal/NotFound";

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
  it("should explain the missing page when rendered", () => {
    render(<TmNotFound />);
    expect(screen.getByRole("heading", { name: "public.notFound" })).toBeTruthy();
    expect(screen.getByText("public.notFoundHint")).toBeTruthy();
  });
  it("should link back to home when rendered", () => {
    render(<TmNotFound />);
    expect(screen.getByText("public.backHome").tagName).toBe("A");
  });
});
