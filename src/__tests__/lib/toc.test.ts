import { describe, it, expect } from "vitest";
import { extractToc } from "@/lib/toc";

describe("extractToc", () => {
  it("collects level-2 headings in order, stripping trailing hashes", () => {
    const md = "# Title\n\n## First\n\ntext\n\n## Second ##\n\n### deeper\n";
    expect(extractToc(md)).toEqual(["First", "Second"]);
  });

  it("ignores ## lines inside fenced code blocks", () => {
    const md = "## Real\n\n```bash\n## not a heading\necho hi\n```\n\n## Also real";
    expect(extractToc(md)).toEqual(["Real", "Also real"]);
  });

  it("returns an empty array when there are no h2s", () => {
    expect(extractToc("# only h1\n\njust text")).toEqual([]);
  });
});
