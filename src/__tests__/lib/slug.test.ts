import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("drops punctuation instead of leaving it in the slug", () => {
    // The regression: "1. Test" used to become "1.-test".
    expect(slugify("1. Test")).toBe("1-test");
    expect(slugify("1.Test")).toBe("1-test");
    expect(slugify("C++ Tips")).toBe("c-tips");
    expect(slugify("Node.js 101")).toBe("node-js-101");
    expect(slugify("a, b & c")).toBe("a-b-c");
  });

  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("  trim me  ")).toBe("trim-me");
  });

  it("romanizes 中文 to Wade-Giles", () => {
    expect(slugify("啟靈工程師 note")).toBe("chi-ling-kung-cheng-shih-note");
  });

  it("returns an empty string when nothing is slug-able", () => {
    expect(slugify("---")).toBe("");
  });
});
