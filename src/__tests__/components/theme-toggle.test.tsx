// @vitest-environment happy-dom
//
// The admin header's theme control. It is one line of JSX, which is exactly why
// it was at 0% — but the line IS the behaviour: it fixes the two style props the
// admin chrome gets, and a header control that stops being ghost/icon-sized
// visibly breaks the header layout. Nothing else pins them.

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/components/ThemeToggle";

const themeMenu = vi.hoisted(() => vi.fn());
vi.mock("@/components/ThemeMenu", () => ({
  ThemeMenu: (props: { variant?: string; size?: string }) => {
    themeMenu(props);
    return <button type="button">theme</button>;
  },
}));

afterEach(cleanup);

describe("ThemeToggle", () => {
  it("renders the shared theme menu with the admin header's styling", () => {
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "theme" })).toBeTruthy();
    expect(themeMenu).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "ghost", size: "icon" }),
    );
  });
});
