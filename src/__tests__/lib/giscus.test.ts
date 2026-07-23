import { describe, expect, it } from "vitest";
import { giscusFromSettings } from "@/lib/giscus";

const full = {
  giscus_repo: "imgarylai/laigary.com",
  giscus_repo_id: "R_x",
  giscus_category: "Comments",
  giscus_category_id: "DIC_x",
};

describe("giscusFromSettings", () => {
  it("should build the config when all four settings are present", () => {
    expect(giscusFromSettings(full)).toEqual({
      repo: "imgarylai/laigary.com",
      repoId: "R_x",
      category: "Comments",
      categoryId: "DIC_x",
    });
  });

  it("should return null when any setting is missing or empty", () => {
    expect(giscusFromSettings({})).toBeNull();
    for (const key of Object.keys(full)) {
      expect(giscusFromSettings({ ...full, [key]: "" })).toBeNull();
    }
  });
});
