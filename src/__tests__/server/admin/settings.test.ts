// @vitest-environment node
//
// Settings upsert against the real better-sqlite3 harness. The normalization
// assertions read the values back out rather than inspecting the call, so they
// prove what a later read actually returns.

import { describe, it, expect } from "vitest";
import { setupTestDb } from "../../db/helpers/test-db";

setupTestDb();

describe("updateSettingsImpl", () => {
  it("stores the key/value map", async () => {
    const { updateSettingsImpl } = await import("@/server/admin/settings");
    const { getSiteSettings } = await import("@/db/queries");
    const values = { site_name: "Psychedelic Engineer", author_name: "Gary" };

    expect(await updateSettingsImpl(values)).toEqual({ ok: true });
    expect(await getSiteSettings()).toEqual(values);
  });

  it("overwrites a key that is already set", async () => {
    const { updateSettingsImpl } = await import("@/server/admin/settings");
    const { getSiteSetting } = await import("@/db/queries");

    await updateSettingsImpl({ site_name: "v1" });
    await updateSettingsImpl({ site_name: "v2" });

    expect(await getSiteSetting("site_name")).toBe("v2");
  });

  it("normalizes social keys to bare handles and leaves other keys untouched", async () => {
    const { updateSettingsImpl } = await import("@/server/admin/settings");
    const { getSiteSettings } = await import("@/db/queries");

    await updateSettingsImpl({
      author_twitter: "https://x.com/@imgarylai/",
      author_github: "@imgarylai",
      site_name: "Unconstrained",
    });

    expect(await getSiteSettings()).toEqual({
      author_twitter: "imgarylai",
      author_github: "imgarylai",
      site_name: "Unconstrained",
    });
  });
});

describe("settingsSchema", () => {
  it("accepts a string map", async () => {
    const { settingsSchema } = await import("@/server/admin/settings");
    expect(() => settingsSchema.parse({ a: "1", b: "2" })).not.toThrow();
  });

  it("rejects non-string values", async () => {
    const { settingsSchema } = await import("@/server/admin/settings");
    expect(() => settingsSchema.parse({ a: 1 })).toThrow();
  });
});
