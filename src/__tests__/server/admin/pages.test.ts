import { describe, it, expect, vi, beforeEach } from "vitest";
import * as queries from "@/db/queries";
import { upsertPageImpl, pageUpsertSchema } from "@/server/admin/pages";

vi.mock("@/db/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db/queries")>();
  return { ...actual, upsertPage: vi.fn() };
});

beforeEach(() => vi.clearAllMocks());

describe("upsertPageImpl", () => {
  it("splits slug from the payload and calls upsertPage", async () => {
    vi.mocked(queries.upsertPage).mockResolvedValue({ slug: "about" });
    const res = await upsertPageImpl({ slug: "about", title: "About", contentMd: "hi" });
    expect(queries.upsertPage).toHaveBeenCalledWith("about", { title: "About", contentMd: "hi" });
    expect(res).toEqual({ ok: true });
  });

  it("works with only a slug", async () => {
    vi.mocked(queries.upsertPage).mockResolvedValue({ slug: "now" });
    expect(await upsertPageImpl({ slug: "now" })).toEqual({ ok: true });
    expect(queries.upsertPage).toHaveBeenCalledWith("now", {});
  });
});

describe("pageUpsertSchema", () => {
  it("requires a slug", () => {
    expect(() => pageUpsertSchema.parse({ title: "About" })).toThrow();
  });
});
