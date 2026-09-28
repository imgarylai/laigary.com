// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PublicShell } from "@/features/public-site/PublicShell";
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  linkOptions: (options: unknown) => options,
}));
vi.mock("@/server/posts", () => ({ searchPostsFn: vi.fn() }));
vi.mock("@/server/public", () => ({ searchInterviewNotesFn: vi.fn() }));
vi.mock("@/features/public-site/Header", () => ({
  PublicHeader: ({ onOpenSearch }: { onOpenSearch: () => void }) => (
    <button onClick={onOpenSearch}>Search</button>
  ),
}));
vi.mock("@/features/terminal/CommandPalette", () => ({
  CommandPalette: ({ open }: { open: boolean }) => <div data-testid="search" data-open={open} />,
}));
afterEach(cleanup);
function shell() {
  render(
    <PublicShell social={{ github: null, twitter: null, linkedin: null, email: null }}>
      <input aria-label="Input" />
      <p>Page</p>
    </PublicShell>,
  );
}
const modK = (target: Node = document) =>
  fireEvent.keyDown(target, { key: "k", code: "KeyK", ctrlKey: true });
describe("public shell", () => {
  it("should expose a skip target when the page renders", () => {
    shell();
    expect(screen.getByRole("main").id).toBe("main-content");
    expect(screen.getByRole("link", { name: "public.skipContent" }).getAttribute("href")).toBe(
      "#main-content",
    );
  });
  it("should toggle search when mod+k is pressed including from an input", () => {
    shell();
    expect(screen.getByTestId("search").getAttribute("data-open")).toBe("false");
    modK();
    expect(screen.getByTestId("search").getAttribute("data-open")).toBe("true");
    const input = screen.getByRole("textbox");
    input.focus();
    modK(input);
    expect(screen.getByTestId("search").getAttribute("data-open")).toBe("false");
  });
  it("should open search when its header button is activated", () => {
    shell();
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(screen.getByTestId("search").getAttribute("data-open")).toBe("true");
  });
});
