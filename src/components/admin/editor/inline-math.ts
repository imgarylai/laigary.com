// Inline LaTeX node wired into the official @tiptap/markdown bridge.
//
// @aarkue/tiptap-math-extension provides the node, its input rules, and the
// KaTeX rendering, but knows nothing about markdown. Without a mapping the
// serializer falls back to raw HTML (`<span data-latex="...">`) with
// HTML-escaped entities inside the stored markdown — which is how `&gt;`
// ended up in note content and broke the frontend temml render.
import { InlineMathNode } from "@aarkue/tiptap-math-extension";

export interface MathTokenMatch {
  raw: string;
  latex: string;
  display: boolean;
}

/**
 * Match `$...$` / `$$...$$` at the start of `src`, following remark-math's
 * conventions so the editor agrees with the frontend renderer: single-dollar
 * content must not start or end with whitespace, and the closing `$` must not
 * be followed by a digit (protects prose like "$5 and $10").
 */
export function matchDollarMath(src: string): MathTokenMatch | null {
  if (!src.startsWith("$")) return null;
  if (src.startsWith("$$")) {
    const match = /^\$\$([\s\S]+?)\$\$/.exec(src);
    return match ? { raw: match[0], latex: match[1].trim(), display: true } : null;
  }
  const match = /^\$([^\n$]+?)\$/.exec(src);
  if (!match) return null;
  const latex = match[1];
  if (/^\s/.test(latex) || /\s$/.test(latex)) return null;
  if (/^\d/.test(src.slice(match[0].length))) return null;
  return { raw: match[0], latex, display: false };
}

export const InlineMath = InlineMathNode.extend({
  markdownTokenName: "inlineMath",
  markdownTokenizer: {
    name: "inlineMath",
    level: "inline",
    start: "$",
    tokenize(src) {
      const match = matchDollarMath(src);
      if (!match) return undefined;
      return { type: "inlineMath", ...match };
    },
  },
  parseMarkdown(token) {
    return {
      type: "inlineMath",
      attrs: {
        latex: (token as { latex?: string }).latex ?? "",
        display: (token as { display?: boolean }).display ? "yes" : "no",
        evaluate: "no",
      },
    };
  },
  renderMarkdown(node) {
    const attrs = (node.attrs ?? {}) as { latex?: string; display?: string };
    const latex = attrs.latex ?? "";
    return attrs.display === "yes" ? `$$${latex}$$` : `$${latex}$`;
  },
});
