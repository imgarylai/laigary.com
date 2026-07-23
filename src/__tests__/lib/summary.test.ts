import { describe, expect, it } from "vitest";
import { plainTextSummary } from "@/lib/summary";

describe("plainTextSummary", () => {
  it("should strip tags and collapse whitespace when summarizing html", () => {
    expect(plainTextSummary("<h1>Title</h1>\n<p>Some  <strong>bold</strong> text.</p>", 100)).toBe(
      "Title Some bold text.",
    );
  });

  it("should truncate with an ellipsis when the text exceeds max", () => {
    const out = plainTextSummary(`<p>${"word ".repeat(50)}</p>`, 20);
    expect(out.length).toBe(21);
    expect(out.endsWith("…")).toBe(true);
  });

  it("should return short text untouched when under max", () => {
    expect(plainTextSummary("<p>short</p>", 20)).toBe("short");
  });
});
