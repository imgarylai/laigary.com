import { Prose } from "@/features/terminal/Prose";

// Some existing CMS documents begin with their own title. The reading shell
// already owns h1; normalize only the public presentation, never stored Markdown
// or the admin preview. Keep heading IDs so existing deep links still resolve.
export function articleBodyHtml(html: string, title: string): string {
  const escapedTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return html
    .replace(
      /^\s*<h1\b([^>]*)>([\s\S]*?)<\/h1>\s*/i,
      (heading, attributes: string, text: string) => {
        if (text.replace(/<[^>]*>/g, "").trim() !== escapedTitle) return heading;
        // Preserve the original anchor without repeating the heading visually or
        // in the accessibility tree. Attributes come from the same rendered HTML.
        return `<span${attributes} aria-hidden="true"></span>`;
      },
    )
    .replace(/<(\/?)h1(\s|>)/gi, "<$1h2$2");
}

export function ArticleBody({ html, title }: { html: string; title: string }) {
  return <Prose html={articleBodyHtml(html, title)} />;
}
