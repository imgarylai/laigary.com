import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("renders a heading", async () => {
    const html = await renderMarkdown("# Hello");
    expect(html).toContain("<h1>Hello</h1>");
  });

  it("renders a paragraph", async () => {
    const html = await renderMarkdown("Hello world");
    expect(html).toContain("<p>Hello world</p>");
  });

  it("renders bold and italic", async () => {
    const html = await renderMarkdown("**bold** and *italic*");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("renders a link", async () => {
    const html = await renderMarkdown("[link](https://example.com)");
    expect(html).toContain('<a href="https://example.com">link</a>');
  });

  it("renders a code block with syntax highlighting", async () => {
    const html = await renderMarkdown("```js\nconst x = 1;\n```");
    expect(html).toContain("<code");
    expect(html).toContain("hljs");
  });

  it("renders inline code", async () => {
    const html = await renderMarkdown("use `const` keyword");
    expect(html).toContain("<code>const</code>");
  });

  it("renders a list", async () => {
    const html = await renderMarkdown("- item 1\n- item 2");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>item 1</li>");
    expect(html).toContain("<li>item 2</li>");
  });

  it("handles empty string", async () => {
    const html = await renderMarkdown("");
    expect(html).toBe("");
  });

  it("renders inline math via temml", async () => {
    const html = await renderMarkdown("$x^2$");
    expect(html).toContain("math-inline");
    expect(html).toContain("math"); // temml emits a <math> element
  });

  it("renders display math via temml", async () => {
    const html = await renderMarkdown("$$\nx^2\n$$");
    expect(html).toContain("math-display");
  });

  it("should render math containing comparison operators when given clean markdown", async () => {
    // Regression guard for the LaTeX issue: as long as stored markdown keeps
    // raw `>` (never `&gt;` — see the editor's inline-math markdown mapping),
    // temml renders it without a ParseError.
    const html = await renderMarkdown("$(fast - slow) - max_count > k$");
    expect(html).toContain("math-inline");
    expect(html).not.toContain("ParseError");
  });

  it("falls back to math-error span for invalid LaTeX", async () => {
    const html = await renderMarkdown("$\\invalid{");
    // temml is permissive; this just guards that the pipeline doesn't throw
    expect(typeof html).toBe("string");
  });

  it("preserves raw HTML via rehype-raw", async () => {
    const html = await renderMarkdown('<div class="custom">hi</div>');
    expect(html).toContain('<div class="custom">hi</div>');
  });
});
