import { describe, it, expect } from "vitest";
import { breadcrumbForPath, fsCmd, FS_BLOG, FS_INTERVIEW, INTERVIEW_BASE } from "@/lib/fsmap";

describe("breadcrumbForPath", () => {
  it("maps blog routes to fsmap crumbs", () => {
    expect(breadcrumbForPath("/")).toBe("");
    expect(breadcrumbForPath("/posts")).toBe("posts");
    expect(breadcrumbForPath("/posts/hello-world")).toBe("posts/hello-world.md");
    expect(breadcrumbForPath("/tags")).toBe("tags");
    expect(breadcrumbForPath("/about")).toBe("about.md");
  });

  it("maps interview routes to the interview namespace", () => {
    expect(breadcrumbForPath("/interview")).toBe("interview");
    expect(breadcrumbForPath("/interview/leetcode")).toBe("interview/leetcode");
    expect(breadcrumbForPath("/interview/leetcode/two-sum")).toBe("interview/leetcode/two-sum.md");
  });

  it("truncates long slugs", () => {
    const long = "a".repeat(30);
    expect(breadcrumbForPath(`/posts/${long}`)).toBe(`posts/${"a".repeat(20)}….md`);
  });
});

describe("fsCmd", () => {
  it("emits cd for dirs and cat for files", () => {
    expect(fsCmd(FS_BLOG.archive)).toBe("cd ./posts");
    expect(fsCmd(FS_BLOG.post, { slug: "x" })).toBe("cat ./posts/x.md");
    expect(fsCmd(FS_INTERVIEW.section, { sect: "leetcode" })).toBe("cd ./interview/leetcode");
  });

  it("renders the namespace base itself as cd ~", () => {
    expect(fsCmd(FS_BLOG.home)).toBe("cd ~");
    expect(fsCmd(FS_INTERVIEW.home, {}, INTERVIEW_BASE)).toBe("cd ~");
  });

  it("renders paths relative to the namespace base", () => {
    expect(fsCmd(FS_INTERVIEW.section, { sect: "coding" }, INTERVIEW_BASE)).toBe("cd ./coding");
    expect(fsCmd(FS_INTERVIEW.note, { sect: "coding", slug: "two-sum" }, INTERVIEW_BASE)).toBe(
      "cat ./coding/two-sum.md",
    );
  });
});
