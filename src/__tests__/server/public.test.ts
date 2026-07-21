import { describe, it, expect } from "vitest";
import { mapInterviewSections, DEFAULT_SITE_NAME } from "@/server/public";

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
    expect(DEFAULT_SITE_NAME).toBe("Unconstrained");
  });
});
