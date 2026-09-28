import { describe, expect, it } from "vitest";
import { articleBodyHtml } from "@/features/public-site/ArticleBody";

describe("public article heading hierarchy", () => {
  it("should keep the anchor without repeating the title when Markdown starts with the page title", () => {
    const html = articleBodyHtml(
      '<h1 id="title">A &amp; B</h1><p>Content</p><h2 id="topic">Topic</h2>',
      "A & B",
    );
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("A &amp; B");
    expect(html).toContain('id="title"');
    expect(html).toContain('<h2 id="topic">Topic</h2>');
    expect(html).toContain("<p>Content</p>");
  });
  it("should retain a different heading as a section when the body has its own h1", () => {
    expect(articleBodyHtml('<h1 id="other">Another topic</h1>', "Page title")).toBe(
      '<h2 id="other">Another topic</h2>',
    );
  });
  it("should preserve body markup when it starts without a title", () => {
    const html = "<p>Introduction</p><pre><code>&lt;h1&gt;Example&lt;/h1&gt;</code></pre>";
    expect(articleBodyHtml(html, "Title")).toBe(html);
  });
});
