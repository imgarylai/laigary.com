// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TmButton } from "@/features/terminal/Button";

afterEach(cleanup);

describe("TmButton", () => {
  it("should render a button with the default (sm) size", () => {
    render(<TmButton>run</TmButton>);
    const btn = screen.getByRole("button", { name: "run" });
    // sm branch of the size ternary → height + horizontal padding, not a square.
    expect(btn.className).toContain("h-7");
    expect(btn.className).toContain("px-2.5");
    expect(btn.className).not.toContain("size-8");
  });

  it("should render a square control for the icon size", () => {
    render(
      <TmButton size="icon" aria-label="search">
        <svg />
      </TmButton>,
    );
    const btn = screen.getByRole("button", { name: "search" });
    // icon branch of the size ternary → fixed square, no sm padding.
    expect(btn.className).toContain("size-8");
    expect(btn.className).not.toContain("h-7");
  });

  it("should forward clicks", () => {
    const onClick = vi.fn();
    render(<TmButton onClick={onClick}>go</TmButton>);
    fireEvent.click(screen.getByRole("button", { name: "go" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("should not fire clicks when disabled", () => {
    const onClick = vi.fn();
    render(
      <TmButton disabled onClick={onClick}>
        nope
      </TmButton>,
    );
    fireEvent.click(screen.getByRole("button", { name: "nope" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("should merge caller classNames over the base styles", () => {
    render(<TmButton className="tm-custom">x</TmButton>);
    expect(screen.getByRole("button", { name: "x" }).className).toContain("tm-custom");
  });
});
