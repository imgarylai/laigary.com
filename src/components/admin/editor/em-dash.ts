// Extension comes from @tiptap/react, which re-exports @tiptap/core — pnpm does
// not expose the latter transitively (same route markdown-paste.ts takes).
import { Extension, textInputRule } from "@tiptap/react";

/**
 * Em-dash, but never on a line that so far holds nothing but hyphens.
 *
 * Typography's own rule is `/--$/`, which fires anywhere — including on the
 * second hyphen of a `---` divider. The horizontal rule still appeared, because
 * its input rule carries `—-` alongside `---` precisely to cope with that. What
 * it cost was the text *behind* the rule: Backspace runs `undoInputRule`, which
 * restores what was actually typed, and what was actually typed by then was an
 * em-dash plus a hyphen. Deleting a divider left `—-` sitting in the document,
 * which reads as "the divider turned back into two dashes".
 *
 * `[^-]` requires a non-hyphen character before the pair, so `--` at the start
 * of a block is left alone and `---` reaches the horizontal-rule rule as three
 * literal hyphens. Undo then gives back `---`, which is what was typed. A pair
 * that follows ordinary text or a space — the em-dash people actually want —
 * still converts.
 *
 * The capture group is the part to replace, not a backreference: textInputRule
 * keeps whatever precedes `match[1]` and swaps only the group for `replace`.
 */
export const EmDash = Extension.create({
  name: "emDash",

  addInputRules() {
    return [textInputRule({ find: /[^-](--)$/, replace: "—" })];
  },
});
