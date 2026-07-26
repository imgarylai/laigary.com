import { describe, expect, it } from "vitest";
import {
  INDENT_UNIT,
  lineStartAt,
  outdentWidth,
  selectedLineStarts,
  spansMultipleLines,
} from "@/components/admin/editor/code-indent";

describe("lineStartAt", () => {
  it("should return 0 when the offset is on the first line", () => {
    expect(lineStartAt("abc\ndef", 2)).toBe(0);
  });

  it("should return the offset after the preceding break when the offset is on a later line", () => {
    expect(lineStartAt("abc\ndef", 5)).toBe(4);
  });

  it("should return the line's own start when the offset already sits on it", () => {
    expect(lineStartAt("abc\ndef", 4)).toBe(4);
  });
});

describe("selectedLineStarts", () => {
  const text = "one\ntwo\nthree";

  it("should return a single start when the selection stays within one line", () => {
    expect(selectedLineStarts(text, 1, 2)).toEqual([0]);
  });

  it("should return the start of every line the selection crosses", () => {
    expect(selectedLineStarts(text, 1, 9)).toEqual([0, 4, 8]);
  });

  it("should return the caret's line when the selection is empty", () => {
    expect(selectedLineStarts(text, 5, 5)).toEqual([4]);
  });

  it("should exclude a line the selection only reaches the start of", () => {
    // Dragging down through "one" lands the end at offset 4 — the start of
    // "two". That line was never highlighted, so Tab must leave it alone.
    expect(selectedLineStarts(text, 0, 4)).toEqual([0]);
  });
});

describe("outdentWidth", () => {
  it("should report a full indent unit when the line is indented at least that far", () => {
    expect(outdentWidth("    deep", 0)).toBe(INDENT_UNIT.length);
  });

  it("should report only the spaces present when the line is indented less than a unit", () => {
    expect(outdentWidth(" shallow", 0)).toBe(1);
  });

  it("should report zero when the line is already flush so nothing is eaten", () => {
    expect(outdentWidth("flush", 0)).toBe(0);
  });

  it("should treat a leading tab as one level since pasted code can carry them", () => {
    expect(outdentWidth("\tpasted", 0)).toBe(1);
  });

  it("should measure from the requested line rather than the start of the text", () => {
    expect(outdentWidth("flush\n    deep", 6)).toBe(INDENT_UNIT.length);
  });
});

describe("spansMultipleLines", () => {
  it("should be true when the selection crosses a line break", () => {
    expect(spansMultipleLines("one\ntwo", 1, 6)).toBe(true);
  });

  it("should be false when the selection stays on one line", () => {
    expect(spansMultipleLines("one\ntwo", 0, 3)).toBe(false);
  });

  it("should be false when the selection is empty", () => {
    expect(spansMultipleLines("one\ntwo", 2, 2)).toBe(false);
  });
});
