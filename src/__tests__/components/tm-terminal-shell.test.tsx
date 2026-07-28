// @vitest-environment jsdom
//
// The terminal namespace wrapper. It owns exactly one piece of state — whether
// the ⌘K palette is open — and it is the app's single registration of that
// hotkey, shared by the blog and interview layouts. Binding it twice (or losing
// `enableOnFormTags`, so ⌘K dies the moment focus is in the palette's own input
// or a search box) is invisible until someone presses the key.
//
// The three children are stubbed: what they render has its own tests, and what
// matters here is which props the shell hands them and when.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TerminalShell } from "@/features/terminal/TerminalShell";

const { header, palette } = vi.hoisted(() => ({ header: vi.fn(), palette: vi.fn() }));

vi.mock("@/features/terminal/TmHeader", () => ({
  TmHeader: (props: { homeTo: string; onOpenPalette: () => void }) => {
    header(props);
    return (
      <button type="button" onClick={props.onOpenPalette}>
        open-palette
      </button>
    );
  },
}));
vi.mock("@/features/terminal/TmFooter", () => ({
  TmFooter: ({ siteName }: { siteName: string }) => <footer>{siteName}</footer>,
}));
vi.mock("@/features/terminal/CommandPalette", () => ({
  CommandPalette: (props: { open: boolean; onOpenChange: (v: boolean) => void }) => {
    palette(props);
    return <div data-testid="palette" data-open={String(props.open)} />;
  },
}));

const shellProps = {
  homeTo: "/",
  navItems: [{ label: "posts", to: "/posts", cmd: "cd ./posts" }],
  palettePages: [],
  paletteSearch: async () => [],
  palettePlaceholder: "search",
  siteName: "Unconstrained",
  social: { github: null, twitter: null, linkedin: null, email: null },
};

function renderShell() {
  return render(
    <TerminalShell {...shellProps}>
      <p>page body</p>
    </TerminalShell>,
  );
}

const paletteOpen = () => screen.getByTestId("palette").getAttribute("data-open");

// The binding is `mod+k`, and react-hotkeys-hook resolves `mod` per platform:
// Meta on Apple, Control everywhere else. jsdom's user agent is not Apple, so
// the modifier that actually fires here is ctrl — a metaKey event matches
// nothing and every assertion below would pass or fail for the wrong reason.
const pressModK = (target: Node = document) =>
  fireEvent.keyDown(target, { key: "k", code: "KeyK", ctrlKey: true });

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("TerminalShell", () => {
  it("frames the page with the header, content and footer", () => {
    renderShell();

    expect(screen.getByText("page body")).toBeTruthy();
    expect(screen.getByText("Unconstrained")).toBeTruthy();
    expect(header).toHaveBeenCalledWith(expect.objectContaining({ homeTo: "/" }));
  });

  it("starts with the palette closed", () => {
    renderShell();

    expect(paletteOpen()).toBe("false");
  });

  it("opens the palette on mod+K", () => {
    renderShell();

    pressModK();

    expect(paletteOpen()).toBe("true");
  });

  it("closes the palette on a second mod+K", () => {
    // Toggle, not open: the shortcut is the only way in and should be the way
    // back out too. A handler that just sets `true` passes the test above.
    renderShell();

    pressModK();
    pressModK();

    expect(paletteOpen()).toBe("false");
  });

  it("keeps mod+K working while a form field has focus", () => {
    // enableOnFormTags. Without it the shortcut dies exactly where it is most
    // useful — the palette's own input, and any search box on the page.
    const { container } = renderShell();
    const input = document.createElement("input");
    container.appendChild(input);
    input.focus();

    pressModK(input);

    expect(paletteOpen()).toBe("true");
  });

  it("lets the header open the palette too", () => {
    renderShell();

    fireEvent.click(screen.getByText("open-palette"));

    expect(paletteOpen()).toBe("true");
  });

  it("hands the palette its rows, search and placeholder", () => {
    renderShell();

    expect(palette).toHaveBeenCalledWith(
      expect.objectContaining({
        pages: shellProps.palettePages,
        searchContent: shellProps.paletteSearch,
        placeholder: "search",
      }),
    );
  });
});
