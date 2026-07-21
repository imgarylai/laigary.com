import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkRehype, { type Options as RemarkRehypeOptions } from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import temml from "temml";
import type { Element, Text } from "hast";

// Render LaTeX → MathML at SSR time using temml. Bundling katex blew past
// Cloudflare's 3 MiB Worker limit; temml is ~125 KiB minified and emits MathML,
// which every modern browser renders natively (no client JS required).
function temmlNode(value: string, displayMode: boolean): Element {
  try {
    const html = temml.renderToString(value, { displayMode, throwOnError: false });
    return {
      type: "element",
      tagName: "span",
      properties: { className: [displayMode ? "math-display" : "math-inline"] },
      children: [{ type: "raw", value: html } as unknown as Text],
    };
  } catch {
    return {
      type: "element",
      tagName: "code",
      properties: { className: ["math-error"] },
      children: [{ type: "text", value }],
    };
  }
}

const remarkRehypeOptions: RemarkRehypeOptions = {
  allowDangerousHtml: true,
  handlers: {
    inlineMath: (_state, node: { value: string }) => temmlNode(node.value, false),
    math: (_state, node: { value: string }) => temmlNode(node.value, true),
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkRehype, remarkRehypeOptions)
  .use(rehypeRaw)
  // detect: fences without a language get auto-detected within `subset` (the
  // languages this blog actually uses), so untagged code still gets colors.
  // Content that must stay uncolored (example output, ASCII diagrams) opts out
  // with ```text — the established convention in the note corpus.
  .use(rehypeHighlight, {
    detect: true,
    // no cpp: the author doesn't write it, and its grammar loves to claim
    // python snippets (both corpus "cpp" detections were actually python).
    subset: ["python", "javascript", "typescript", "java", "go", "sql", "bash", "json", "yaml"],
  })
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function renderMarkdown(markdown: string): Promise<string> {
  const result = await processor.process(markdown);
  return String(result);
}
