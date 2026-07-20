// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestDb } from "./test-db";
import { tags } from "@/db/schema";

describe("test-db harness", () => {
  let harness: ReturnType<typeof createTestDb>;

  beforeAll(() => {
    harness = createTestDb();
  });

  afterAll(() => {
    harness.close();
  });

  it("applies migrations and exposes drizzle queries", async () => {
    await harness.db.insert(tags).values({ id: "t1", name: "Test", slug: "test" });
    const rows = await harness.db.select().from(tags);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "t1", name: "Test", slug: "test" });
  });

  it("truncateAll wipes data between tests", async () => {
    harness.truncateAll();
    const rows = await harness.db.select().from(tags);
    expect(rows).toHaveLength(0);
  });
});
