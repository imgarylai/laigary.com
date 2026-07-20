// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { createTestDb } from "../helpers/test-db";

const harness = createTestDb();

vi.mock("drizzle-orm/d1", () => ({
  drizzle: () => harness.db,
}));

beforeEach(() => harness.truncateAll());
afterAll(() => harness.close());

describe("updateSiteSettings", () => {
  it("inserts new keys", async () => {
    const { updateSiteSettings, getSiteSettings } = await import("@/db/queries");
    await updateSiteSettings({ site_name: "Blog", site_url: "https://x.com" });

    const all = await getSiteSettings();
    expect(all).toEqual({ site_name: "Blog", site_url: "https://x.com" });
  });

  it("overwrites existing keys", async () => {
    const { updateSiteSettings, getSiteSetting } = await import("@/db/queries");
    await updateSiteSettings({ site_name: "v1" });
    await updateSiteSettings({ site_name: "v2" });

    expect(await getSiteSetting("site_name")).toBe("v2");
  });

  it("mixes inserts and updates in one call", async () => {
    const { updateSiteSettings, getSiteSettings } = await import("@/db/queries");
    await updateSiteSettings({ a: "1" });
    await updateSiteSettings({ a: "2", b: "3" });

    expect(await getSiteSettings()).toEqual({ a: "2", b: "3" });
  });
});

describe("getSiteSetting", () => {
  it("returns null for unknown key", async () => {
    const { getSiteSetting } = await import("@/db/queries");
    expect(await getSiteSetting("nope")).toBeNull();
  });
});
