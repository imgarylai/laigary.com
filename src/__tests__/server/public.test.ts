import { describe, it, expect } from "vitest";
import { mapInterviewSections, pickSocial, DEFAULT_SITE_NAME } from "@/server/public";

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

describe("pickSocial", () => {
  it("resolves stored handles to absolute profile urls and email to mailto", () => {
    expect(
      pickSocial({
        author_github: "imgarylai",
        author_twitter: "imgarylai",
        author_linkedin: "imgarylai",
        author_email: "gary@example.com",
      }),
    ).toEqual({
      github: "https://github.com/imgarylai",
      twitter: "https://x.com/imgarylai",
      linkedin: "https://linkedin.com/in/imgarylai",
      email: "mailto:gary@example.com",
    });
  });

  it("maps unset settings to null", () => {
    expect(pickSocial({})).toEqual({ github: null, twitter: null, linkedin: null, email: null });
  });
});

describe("DEFAULT_SITE_NAME", () => {
  it("is the brand fallback used when site_name is unset", () => {
    expect(DEFAULT_SITE_NAME).toBe("Unconstrained");
  });
});
