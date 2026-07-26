// Indent maths for code blocks, kept free of ProseMirror so the line-splitting
// rules can be tested directly. `code-block.ts` turns these offsets into a
// transaction.
//
// Offsets are relative to the code block's text content (the block is a single
// text node whose newlines separate lines), never to document positions.

/** Two spaces, matching the repo's own formatting. Never a tab character: the
 *  stored markdown should not depend on anyone's tab width. */
export const INDENT_UNIT = "  ";

/** Offset of the start of the line containing `offset`. */
export function lineStartAt(text: string, offset: number): number {
  return text.lastIndexOf("\n", offset - 1) + 1;
}

/**
 * Start offsets of every line the selection touches, ascending.
 *
 * A selection ending exactly at a line start (the usual result of dragging
 * down through a line) does not reach into that line, so it is excluded —
 * otherwise Tab would indent one line more than the user highlighted.
 */
export function selectedLineStarts(text: string, from: number, to: number): number[] {
  const starts = [lineStartAt(text, from)];

  for (let cursor = starts[0]; ; ) {
    const nextBreak = text.indexOf("\n", cursor);
    if (nextBreak === -1) break;

    const nextStart = nextBreak + 1;
    // `>=`, not `>`: a selection ending exactly on a line start stops short of
    // that line. `<=` here would indent one line more than was highlighted.
    if (nextStart >= to) break;

    starts.push(nextStart);
    cursor = nextStart;
  }

  return starts;
}

/**
 * How many leading whitespace characters to strip at `lineStart` when
 * outdenting: up to one indent unit, stopping at the first non-space so an
 * unindented line loses nothing rather than eating into the code.
 */
export function outdentWidth(text: string, lineStart: number): number {
  let width = 0;

  while (width < INDENT_UNIT.length && text[lineStart + width] === " ") {
    width += 1;
  }

  // A leading tab (from pasted code) counts as one full level.
  if (width === 0 && text[lineStart] === "\t") return 1;

  return width;
}

/** True when the selection spans a line break, so Tab means "indent the block"
 *  rather than "insert an indent at the cursor". */
export function spansMultipleLines(text: string, from: number, to: number): boolean {
  return text.slice(from, to).includes("\n");
}
