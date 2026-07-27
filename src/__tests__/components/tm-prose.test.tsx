// @vitest-environment jsdom
//
// Prose injects pipeline HTML with dangerouslySetInnerHTML. React compares that
// prop by object identity, so a fresh `{ __html }` literal per render makes it
// re-assign innerHTML and rebuild the whole subtree even when the HTML is
// byte-identical. In the editor's live preview that ran on every keystroke and
// cost more in layout than the markdown pipeline itself (#175).

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Prose } from "@/features/terminal/Prose";

afterEach(cleanup);

const HTML = "<h2>Title</h2><p>Body text</p>";

describe("Prose", () => {
  it("should render the pipeline's HTML", () => {
    const { container } = render(<Prose html={HTML} />);

    expect(container.querySelector("h2")?.textContent).toBe("Title");
    expect(container.querySelector("p")?.textContent).toBe("Body text");
  });

  it("should keep the terminal prose class alongside any caller class", () => {
    const { container } = render(<Prose html={HTML} className="mt-4" />);

    const div = container.firstElementChild!;
    expect(div.classList.contains("tm-prose")).toBe(true);
    expect(div.classList.contains("mt-4")).toBe(true);
  });

  it("should not rebuild the DOM when re-rendered with the same HTML", () => {
    const { container, rerender } = render(<Prose html={HTML} />);
    const before = container.querySelector("h2");

    rerender(<Prose html={HTML} />);

    // Same node object, not an equal one: a re-assigned innerHTML would have
    // discarded the original and built a replacement.
    expect(container.querySelector("h2")).toBe(before);
  });

  it("should not rebuild the DOM when only the className changes", () => {
    // memo cannot save us here — the props genuinely differ — so this is what
    // the stable `{ __html }` object is for.
    const { container, rerender } = render(<Prose html={HTML} className="mt-4" />);
    const before = container.querySelector("h2");

    rerender(<Prose html={HTML} className="mt-8" />);

    expect(container.firstElementChild!.classList.contains("mt-8")).toBe(true);
    expect(container.querySelector("h2")).toBe(before);
  });

  it("should replace the content when the HTML actually changes", () => {
    const { container, rerender } = render(<Prose html={HTML} />);

    rerender(<Prose html="<p>Something else</p>" />);

    expect(container.querySelector("h2")).toBeNull();
    expect(container.querySelector("p")?.textContent).toBe("Something else");
  });
});
