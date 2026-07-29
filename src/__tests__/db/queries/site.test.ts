// @vitest-environment node

import { describe, it, expect } from "vitest";
import { setupTestDb } from "../helpers/test-db";

const harness = setupTestDb();

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

  it("is a no-op for an empty map", async () => {
    const { updateSiteSettings, getSiteSettings } = await import("@/db/queries");
    await updateSiteSettings({ site_name: "v1" });
    await updateSiteSettings({});

    expect(await getSiteSettings()).toEqual({ site_name: "v1" });
  });

  it("leaves every key untouched when one of them fails", async () => {
    const { updateSiteSettings, getSiteSettings } = await import("@/db/queries");
    await updateSiteSettings({ site_name: "v1" });

    // `value` is NOT NULL, so the second entry blows up mid-write. The first is
    // an update to an existing row and the third a fresh insert — neither may
    // survive a rejected call.
    await expect(
      updateSiteSettings({
        site_name: "v2",
        broken: null as unknown as string,
        site_url: "https://x.com",
      }),
    ).rejects.toThrow();

    expect(await getSiteSettings()).toEqual({ site_name: "v1" });
  });
});

describe("getSiteSetting", () => {
  it("returns null for unknown key", async () => {
    const { getSiteSetting } = await import("@/db/queries");
    expect(await getSiteSetting("nope")).toBeNull();
  });
});

describe("getSiteSettings caching", () => {
  it("should serve the map from cache until a write through the query layer invalidates it", async () => {
    const { updateSiteSettings, getSiteSettings } = await import("@/db/queries");
    await updateSiteSettings({ site_name: "v1" });
    expect(await getSiteSettings()).toEqual({ site_name: "v1" });

    // Write behind the query layer's back — the cache has no way to see this,
    // so a stale read here is the proof that the second call never hit D1.
    harness.sqlite.prepare("UPDATE site_settings SET value = 'v2' WHERE key = 'site_name'").run();
    expect(await getSiteSettings()).toEqual({ site_name: "v1" });

    // The settings form goes through updateSiteSettings, which does invalidate.
    await updateSiteSettings({ site_name: "v3" });
    expect(await getSiteSettings()).toEqual({ site_name: "v3" });
  });
});
