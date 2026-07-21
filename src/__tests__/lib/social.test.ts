import { describe, expect, it } from "vitest";
import { isSocialKey, normalizeSocialHandle, socialUrl } from "@/lib/social";

describe("normalizeSocialHandle", () => {
  it("should return the bare handle when given a plain handle", () => {
    expect(normalizeSocialHandle("author_github", "imgarylai")).toBe("imgarylai");
  });

  it("should strip a leading @ when given an at-handle", () => {
    expect(normalizeSocialHandle("author_twitter", "@garylai")).toBe("garylai");
  });

  it("should strip scheme, www, and host when given a full url", () => {
    expect(normalizeSocialHandle("author_github", "https://github.com/imgarylai")).toBe(
      "imgarylai",
    );
    expect(normalizeSocialHandle("author_github", "https://www.github.com/imgarylai/")).toBe(
      "imgarylai",
    );
  });

  it("should accept both x.com and twitter.com when normalizing twitter", () => {
    expect(normalizeSocialHandle("author_twitter", "https://twitter.com/garylai")).toBe("garylai");
    expect(normalizeSocialHandle("author_twitter", "x.com/@garylai")).toBe("garylai");
  });

  it("should keep the linkedin slug when given the /in/ url", () => {
    expect(normalizeSocialHandle("author_linkedin", "https://linkedin.com/in/gary-lai/")).toBe(
      "gary-lai",
    );
  });

  it("should drop query strings and trailing paths when normalizing", () => {
    expect(normalizeSocialHandle("author_github", "github.com/imgarylai?tab=repos")).toBe(
      "imgarylai",
    );
  });

  it("should return an empty string when the value is blank", () => {
    expect(normalizeSocialHandle("author_github", "   ")).toBe("");
  });
});

describe("socialUrl", () => {
  it("should build the absolute profile url when a handle is set", () => {
    expect(socialUrl("author_github", "imgarylai")).toBe("https://github.com/imgarylai");
    expect(socialUrl("author_linkedin", "gary-lai")).toBe("https://linkedin.com/in/gary-lai");
  });

  it("should return null when the handle is empty", () => {
    expect(socialUrl("author_twitter", "")).toBeNull();
  });
});

describe("isSocialKey", () => {
  it("should accept social keys and reject other settings keys", () => {
    expect(isSocialKey("author_github")).toBe(true);
    expect(isSocialKey("site_name")).toBe(false);
  });
});
