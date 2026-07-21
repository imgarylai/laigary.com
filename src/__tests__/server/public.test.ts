import { describe, it, expect } from "vitest";
import { mapInterviewSections, DEFAULT_SITE_NAME, extractToc } from "@/server/public";

describe("mapInterviewSections", () => {
  const sections = [
    { id: "a", slug: "leetcode", label: "LeetCode", blurb: "algos" },
    { id: "b", slug: "system-design", label: "System Design", blurb: "" },
  ];

  it("pairs each section with its note count", () => {
    const counts = new Map([
      ["a", 3],
      ["b", 7],
    ]);
    expect(mapInterviewSections(sections, counts)).toEqual([
      { slug: "leetcode", label: "LeetCode", blurb: "algos", count: 3 },
      { slug: "system-design", label: "System Design", blurb: "", count: 7 },
    ]);
  });

  it("defaults missing counts to 0", () => {
    const counts = new Map([["a", 3]]);
    const result = mapInterviewSections(sections, counts);
    expect(result[1]).toEqual({
      slug: "system-design",
      label: "System Design",
      blurb: "",
      count: 0,
    });
  });
});

describe("DEFAULT_SITE_NAME", () => {
  it("is the brand fallback used when site_name is unset", () => {
    expect(DEFAULT_SITE_NAME).toBe("啟靈工程師");
  });
});

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
