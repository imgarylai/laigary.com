import { describe, it, expect, vi, beforeEach } from "vitest";
import * as queries from "@/db/queries";
import { updateSettingsImpl, settingsSchema } from "@/server/admin/settings";

vi.mock("@/db/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db/queries")>();
  return { ...actual, updateSiteSettings: vi.fn() };
});

beforeEach(() => vi.clearAllMocks());

describe("updateSettingsImpl", () => {
  it("forwards the key/value map to updateSiteSettings", async () => {
    vi.mocked(queries.updateSiteSettings).mockResolvedValue(undefined);
    const values = { site_name: "Psychedelic Engineer", author_name: "Gary" };
    expect(await updateSettingsImpl(values)).toEqual({ ok: true });
    expect(queries.updateSiteSettings).toHaveBeenCalledWith(values);
  });
});

describe("settingsSchema", () => {
  it("accepts a string map", () => {
    expect(() => settingsSchema.parse({ a: "1", b: "2" })).not.toThrow();
  });
  it("rejects non-string values", () => {
    expect(() => settingsSchema.parse({ a: 1 })).toThrow();
  });
});
