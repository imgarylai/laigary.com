// @vitest-environment jsdom
//
// Smoke-renders the shared terminal layout wrappers so their markup (and the
// tm-* type-scale classes) is exercised. These are pure presentational
// components; the test just asserts each renders its slotted content.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// createLink needs router context at render; for a presentational smoke test we
// swap it for identity so TmDirLink / TmRowLink render as their plain anchors.
vi.mock(import("@tanstack/react-router"), async (importOriginal) => ({
  ...(await importOriginal()),
  createLink: ((Comp: unknown) => Comp) as never,
}));

const { TmPage, TmMeta, TmEmpty, TmDirList, TmDirLink, TmDirCells, TmRowLink, TmRowCells } =
  await import("@/features/terminal/layout");

afterEach(cleanup);

describe("terminal layout", () => {
  it("renders the page container and its children", () => {
    render(<TmPage>body</TmPage>);
    expect(screen.getByText("body")).toBeTruthy();
  });

  it("renders the meta and empty lines", () => {
    render(
      <>
        <TmMeta>12 posts</TmMeta>
        <TmEmpty>// nothing here</TmEmpty>
      </>,
    );
    expect(screen.getByText("12 posts")).toBeTruthy();
    expect(screen.getByText("// nothing here")).toBeTruthy();
  });

  // The row subgrids onto the list's columns, so a long label never wraps: the
  // list's first track is content-sized (150px floor) and the label is nowrap.
  it("renders a directory row with its three cells", () => {
    const { container } = render(
      <TmDirList>
        <TmDirLink to="/">
          <TmDirCells label="./behavior-question" desc="the writing" meta="42" />
        </TmDirLink>
      </TmDirList>,
    );
    expect(screen.getByText("the writing")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
    expect(container.firstElementChild?.className).toContain("minmax(150px,max-content)");
    expect(screen.getByText("./behavior-question").className).toContain("whitespace-nowrap");
  });

  it("renders a compact row with date / title / reading time", () => {
    render(
      <TmRowLink to="/">
        <TmRowCells date="01-02" title="Two Sum" read="3m" />
      </TmRowLink>,
    );
    expect(screen.getByText("Two Sum")).toBeTruthy();
    expect(screen.getByText("01-02")).toBeTruthy();
    expect(screen.getByText("3m")).toBeTruthy();
  });
});
