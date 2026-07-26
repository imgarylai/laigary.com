// The one list of languages this blog's code blocks may use.
//
// Three consumers have to agree on it, or a fence looks one way while you write
// it and another way once published:
//   - the editor's lowlight registration (components/admin/editor/extensions.ts)
//   - the render pipeline's auto-detect subset (lib/markdown.ts)
//   - the code block language picker in the admin
//
// Both sides auto-detect untagged fences, so registering different grammar sets
// is enough on its own to make them disagree: highlight.js picks the best match
// from whatever is registered, and a grammar the editor knows but the renderer
// doesn't (or vice versa) silently wins on one side only.
//
// Values are highlight.js grammar names, unchanged: they are what a markdown
// fence carries (```python) and what highlight.js registers under, so a value
// round-trips through stored content untouched.

import type { LanguageFn } from "highlight.js";
import bash from "highlight.js/lib/languages/bash";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import yaml from "highlight.js/lib/languages/yaml";

/**
 * Marks a block that must stay uncoloured — example output, ASCII diagrams.
 * The established convention in the note corpus.
 */
export const PLAIN_LANGUAGE = "text";

/**
 * Grammars an untagged fence may auto-detect into, keyed by fence name. Each
 * one also brings its own aliases along (highlight.js reads them off the
 * definition), so ```py keeps working without a separate entry.
 *
 * Deliberately narrower than "every grammar highlight.js ships": a wide
 * detection pool mislabels short snippets. No cpp — the author doesn't write
 * it, and its grammar loves to claim python snippets (both corpus "cpp"
 * detections were actually python).
 */
const DETECTABLE_GRAMMARS: Record<string, LanguageFn> = {
  bash,
  go,
  java,
  javascript,
  json,
  python,
  sql,
  typescript,
  yaml,
};

/**
 * Everything the editor registers: the detectable grammars plus the plain-text
 * opt-out.
 *
 * `text` has to be a *registered* grammar rather than an absent one. Tiptap's
 * lowlight plugin falls back to `highlightAuto` for any language it cannot
 * resolve, so an unregistered ```text would get auto-detected and coloured —
 * the exact opposite of what the author asked for. highlight.js's plaintext
 * grammar sets `disableAutodetect`, so registering it keeps ```text opted out
 * without ever becoming an auto-detection result itself.
 */
export const CODE_LANGUAGE_GRAMMARS: Record<string, LanguageFn> = {
  ...DETECTABLE_GRAMMARS,
  [PLAIN_LANGUAGE]: plaintext,
};

/** The auto-detection pool, shared by the editor and lib/markdown.ts. */
export const DETECTABLE_LANGUAGES = Object.keys(DETECTABLE_GRAMMARS);

/** Picker options: the plain-text opt-out first, then the grammars by label. */
export const CODE_LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: PLAIN_LANGUAGE, label: "Plain text" },
  { value: "bash", label: "Bash" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "python", label: "Python" },
  { value: "sql", label: "SQL" },
  { value: "typescript", label: "TypeScript" },
  { value: "yaml", label: "YAML" },
];
