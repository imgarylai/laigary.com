import { describe, it, expect } from "vitest";
import {
  articleTemplate,
  formatOgDate,
  formatOgDateFromIsoDay,
  siteTemplate,
  type OgNode,
} from "@/lib/og/templates";

function flattenText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (node !== null && typeof node === "object" && "props" in node) {
    return flattenText((node as OgNode).props.children);
  }
  return "";
}

describe("formatOgDate", () => {
  it("should format unix seconds as a zh-TW long date when given a timestamp", () => {
    // 2025-07-19T20:00:00Z
    expect(formatOgDate(1752960000)).toMatch(/^2025年7月(19|20)日$/);
  });

  it("should return null when the timestamp is null or undefined", () => {
    expect(formatOgDate(null)).toBeNull();
    expect(formatOgDate(undefined)).toBeNull();
  });

  it("should return null when the timestamp is not finite", () => {
    expect(formatOgDate(Number.NaN)).toBeNull();
  });
});

describe("formatOgDateFromIsoDay", () => {
  it("should format a yyyy-MM-dd string without timezone shifting when parsing", () => {
    expect(formatOgDateFromIsoDay("2025-07-19")).toBe("2025年7月19日");
  });

  it("should strip leading zeros when the month or day is single-digit", () => {
    expect(formatOgDateFromIsoDay("2025-01-05")).toBe("2025年1月5日");
  });

  it("should return null when the input is not a yyyy-MM-dd string", () => {
    expect(formatOgDateFromIsoDay("not a date")).toBeNull();
  });
});

describe("siteTemplate", () => {
  it("should render site name, description, and url when building the tree", () => {
    const node = siteTemplate({
      siteName: "啟靈工程師",
      description: "desc",
      siteUrl: "laigary.com",
    });
    const text = flattenText(node);
    expect(text).toContain("啟靈工程師");
    expect(text).toContain("desc");
    expect(text).toContain("laigary.com");
  });
});

describe("articleTemplate", () => {
  const base = { branding: "啟靈工程師 | laigary.com", dateLabel: null, kicker: null };

  it("should include the kicker line when one is provided", () => {
    const node = articleTemplate({ ...base, title: "t", kicker: "./interview/system-design/" });
    expect(flattenText(node)).toContain("./interview/system-design/");
  });

  it("should omit the kicker line when it is null", () => {
    const node = articleTemplate({ ...base, title: "t" });
    expect(flattenText(node)).not.toContain("./interview/");
  });

  it("should shrink the title font when the title exceeds 40 characters", () => {
    const short = articleTemplate({ ...base, title: "short" });
    const long = articleTemplate({ ...base, title: "x".repeat(41) });
    const fontSizeOf = (node: OgNode): number => {
      const children = node.props.children as OgNode[];
      const titleNode = children.find((c) => flattenText(c).length > 0);
      if (!titleNode) throw new Error("title node not found");
      return (titleNode.props.style as { fontSize: number }).fontSize;
    };
    expect(fontSizeOf(short)).toBe(60);
    expect(fontSizeOf(long)).toBe(48);
  });

  it("should render the date label when one is provided", () => {
    const node = articleTemplate({ ...base, title: "t", dateLabel: "2025年7月19日" });
    expect(flattenText(node)).toContain("2025年7月19日");
  });
});
